"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Clock, CalendarClock, Edit, CheckCircle2, XCircle, Play, Loader2, Plus, ClipboardList, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isPast, format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  clients?: { name: string | null } | null;
};
type Client = Database["public"]["Tables"]["clients"]["Row"];
type PartialClient = Pick<Client, "id" | "name">;

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<PartialClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    client_id: "",
    deadline: "", // We'll use this for the UI but map it to timer_end when saving
    status: "pending" as "pending" | "in_progress" | "completed" | "canceled"
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
    fetchClients();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }

  async function fetchTasks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks")
        .select(`
          *,
          clients (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        variant: "destructive",
        title: "Error fetching tasks",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();

    if (!newTask.client_id) {
      toast({
        variant: "destructive",
        title: "Client is required",
        description: "Please select a client for this task.",
      });
      return;
    }

    setActionLoading(true);

    try {
      // Log the data we're trying to insert
      console.log("Attempting to insert task with data:", {
        title: newTask.title,
        description: newTask.description,
        client_id: newTask.client_id,
        timer_end: newTask.deadline || null,
        status: newTask.status,
      });

      // Make sure client_id is a valid UUID
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(newTask.client_id)) {
        console.error("Invalid client_id format:", newTask.client_id);
        toast({
          variant: "destructive",
          title: "Invalid client ID format",
          description: "Please select a valid client.",
        });
        setActionLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title: newTask.title,
          description: newTask.description,
          client_id: newTask.client_id,
          timer_end: newTask.deadline || null,
          status: newTask.status,
        })
        .select();

      if (error) {
        console.error("Supabase error:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      console.log("Task added successfully:", data);

      toast({
        title: "Task added successfully",
      });

      setNewTask({
        title: "",
        description: "",
        client_id: "",
        deadline: "",
        status: "pending"
      });
      setIsAddDialogOpen(false); // Close dialog
      fetchTasks();
    } catch (error) {
      console.error("Error adding task - full error:", error);
      toast({
        variant: "destructive",
        title: "Error adding task",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartTask(taskId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "in_progress",
          timer_start: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
      toast({
        title: "Task started",
        description: "Timer has been started for this task"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error starting task",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCompleteTask(taskId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "completed",
          timer_end: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
      toast({
        title: "Task completed",
        description: "Timer stopped and task marked as completed"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error stopping timer",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelTask(taskId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: "canceled",
          timer_end: new Date().toISOString()
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
      toast({
        title: "Task canceled",
        description: "The task has been marked as canceled"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error canceling task",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    if (!confirm("Are you sure you want to delete this task? This action cannot be undone.")) {
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
      toast({
        title: "Task deleted",
        description: "The task has been permanently deleted"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy h:mm a");
    } catch (e) {
      return dateString;
    }
  }

  function getTimeAgo(dateString: string | null) {
    if (!dateString) return null;
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return null;
    }
  }

  function getStatusBadgeClass(status: string, timerEnd: string | null) {
    if (status === "completed") {
      return "bg-green-100 text-green-800";
    }
    
    if (status === "in_progress") {
      return "bg-yellow-100 text-yellow-800";
    }
    
    if (status === "canceled") {
      return "bg-gray-100 text-gray-800";
    }
    
    // Check if deadline is passed for pending tasks
    if (status === "pending" && timerEnd) {
      try {
        const deadlineDate = new Date(timerEnd);
        if (isPast(deadlineDate)) {
          return "bg-red-100 text-red-800";
        }
      } catch (e) {
        // If there is an error parsing the date, use default color
      }
    }

    return "bg-blue-100 text-blue-800";
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-2">Manage and track your tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
              <DialogDescription>
                Create a new task and assign it to a client.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTask}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={newTask.client_id}
                      onValueChange={(value) => setNewTask({ ...newTask, client_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="description" className="text-right pt-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deadline" className="text-right">
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newTask.deadline}
                    onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={newTask.status}
                      onValueChange={(value: "pending" | "in_progress" | "completed" | "canceled") =>
                        setNewTask({ ...newTask, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Adding..." : "Add Task"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Task filters and sorting options */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <Select
            defaultValue="all"
            onValueChange={(value) => {
              // Filter tasks by status (this would be implemented in a real app)
              console.log("Filter by status:", value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            defaultValue="newest"
            onValueChange={(value) => {
              // Sort tasks (this would be implemented in a real app)
              console.log("Sort by:", value);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center text-center max-w-md">
            <ClipboardList className="h-12 w-12 text-muted-foreground opacity-50 mb-2" />
            <h3 className="text-lg font-medium mb-1">No tasks found</h3>
            <p className="text-muted-foreground mb-4">You haven't created any tasks yet. Get started by adding your first task.</p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Task
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task) => (
            <Card key={task.id} className="p-6 relative overflow-hidden">
              {/* Status indicator */}
              <div className={`absolute top-0 right-0 px-2 py-1 text-xs font-medium rounded-bl-md ${getStatusBadgeClass(task.status, task.timer_end)}`}>
                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
              </div>

              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-1">{task.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {task.clients?.name || "No client"}
                </p>
              </div>

              <p className="text-sm mb-4 line-clamp-3">{task.description}</p>

              <div className="space-y-2 mb-4">
                {task.timer_end && (
                  <div className="flex items-center text-sm">
                    <CalendarClock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      Due: {formatDate(task.timer_end)}
                      {isPast(new Date(task.timer_end)) && task.status === "pending" && (
                        <span className="text-red-500 ml-1">Overdue</span>
                      )}
                    </span>
                  </div>
                )}
                {task.timer_start && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Started: {getTimeAgo(task.timer_start)}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </Link>

                {task.status === "pending" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleStartTask(task.id)}
                    disabled={actionLoading}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>
                )}

                {task.status === "in_progress" && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCompleteTask(task.id)}
                    disabled={actionLoading}
                    className="text-green-600"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Complete
                  </Button>
                )}

                {(task.status === "pending" || task.status === "in_progress") && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCancelTask(task.id)}
                    disabled={actionLoading}
                    className="text-red-600"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleDeleteTask(task.id)}
                  disabled={actionLoading}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
