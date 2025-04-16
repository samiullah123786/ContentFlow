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
import { Clock, CalendarClock, Edit, ArrowRight, CheckCircle2, XCircle, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, isPast, format } from "date-fns";

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
        title: "Please select a client",
        description: "A client must be selected to create a task.",
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

      const { data, error } = await supabase.from("tasks").insert({
        title: newTask.title,
        description: newTask.description,
        client_id: newTask.client_id,
        timer_end: newTask.deadline || null, // Use timer_end instead of deadline
        status: newTask.status,
      }).select();

      if (error) {
        console.error("Supabase error details:", {
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
      fetchTasks();
    } catch (error) {
      console.error("Error adding task - full error:", error);
      toast({
        variant: "destructive",
        title: "Error adding task",
        description: "Please check the console for details.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStartTimer(taskId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          timer_start: new Date().toISOString(),
          status: "in_progress"
        })
        .eq("id", taskId);

      if (error) throw error;
      fetchTasks();
      toast({
        title: "Timer started",
        description: "Work has begun on this task"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error starting timer",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStopTimer(taskId: string) {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          timer_end: new Date().toISOString(),
          status: "completed"
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

  function formatDate(dateString: string | null) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  }

  function getStatusColor(status: string, timerEnd: string | null) {
    if (status === "completed") return "bg-green-100 text-green-800";
    if (status === "canceled") return "bg-gray-100 text-gray-800";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-800";

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
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Tasks</h1>
        <p className="text-muted-foreground mt-2">Manage and track your tasks</p>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">Add New Task</h2>
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
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
          <div>
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="deadline">Deadline (Optional)</Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={newTask.deadline}
                onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Initial Status</Label>
              <Select
                value={newTask.status}
                onValueChange={(value: "pending" | "in_progress" | "completed" | "canceled") =>
                  setNewTask({ ...newTask, status: value })
                }
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
          <Button type="submit" disabled={actionLoading}>
            {actionLoading ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...</> : "Add Task"}
          </Button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tasks.map((task) => (
          <Card key={task.id} className="p-6 relative overflow-hidden">
            {/* Task Header */}
            <div className="mb-4 flex justify-between items-start">
              <h3 className="text-xl font-semibold">{task.title}</h3>
              <Link href={`/tasks/${task.id}`}>
                <Button variant="ghost" size="sm" className="text-xs">
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
              </Link>
            </div>

            {/* Client Name */}
            <p className="text-sm text-muted-foreground mb-3">
              Client: {task.clients?.name || "Unknown"}
            </p>

            {/* Description */}
            <p className="text-muted-foreground mb-4 line-clamp-2">{task.description}</p>

            {/* Status and Deadline Section */}
            <div className="space-y-3 mb-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status, task.timer_end)}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>

              {/* Deadline */}
              {task.timer_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <CalendarClock className="h-3 w-3 mr-1" /> Deadline:
                  </span>
                  <span className={`text-xs font-medium ${isPast(new Date(task.timer_end)) && task.status !== "completed" && task.status !== "canceled" ? "text-red-600" : ""}`}>
                    {format(new Date(task.timer_end), "PPp")}
                  </span>
                </div>
              )}

              {/* Timer */}
              {task.timer_start && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Started:
                  </span>
                  <span className="text-xs font-medium">
                    {formatDate(task.timer_start)}
                  </span>
                </div>
              )}

              {/* Completed Time */}
              {task.timer_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> {task.status === "canceled" ? "Canceled:" : "Completed:"}
                  </span>
                  <span className="text-xs font-medium">
                    {formatDate(task.timer_end)}
                  </span>
                </div>
              )}

              {/* Duration for completed tasks */}
              {task.status === "completed" && task.timer_start && task.timer_end && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-xs font-medium">
                    {(() => {
                      try {
                        const start = new Date(task.timer_start).getTime();
                        const end = new Date(task.timer_end).getTime();
                        const durationMs = end - start;

                        const hours = Math.floor(durationMs / (1000 * 60 * 60));
                        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

                        return `${hours}h ${minutes}m`;
                      } catch (e) {
                        return "Unable to calculate";
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4">
              {task.status !== "completed" && task.status !== "canceled" ? (
                !task.timer_start ? (
                  <Button
                    onClick={() => handleStartTimer(task.id)}
                    size="sm"
                    disabled={actionLoading}
                    className="w-full"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />}
                    Start Work
                  </Button>
                ) : !task.timer_end ? (
                  <div className="flex w-full gap-2">
                    <Button
                      onClick={() => handleStopTimer(task.id)}
                      size="sm"
                      variant="default"
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      Complete
                    </Button>
                    <Button
                      onClick={() => handleCancelTask(task.id)}
                      size="sm"
                      variant="destructive"
                      disabled={actionLoading}
                      className="flex-1"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                      Cancel
                    </Button>
                  </div>
                ) : null
              ) : (
                <Link href={`/tasks/${task.id}`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    View Details <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Deadline Banner for Overdue Tasks */}
            {task.timer_end && task.status === "pending" && isPast(new Date(task.timer_end)) && (
              <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-xs py-1 px-2 text-center">
                Overdue
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
