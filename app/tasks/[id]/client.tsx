"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Save, Trash2, Clock, CalendarClock, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { supabase } from "@/lib/supabase";

// Define a comprehensive Task type that includes all fields we need
type Task = {
  id: string; // UUID is stored as string
  client_id: string; // UUID is stored as string
  assigned_to: string | null;
  description: string | null;
  status: "Pending" | "In Progress" | "Completed";
  timer_start: string | null;
  timer_end: string | null;
  title: string | null;
  created_at: string | null;
  deadline: string | null;
  clients?: { name: string | null } | null;
};

// Client type for the dropdown
type Client = {
  id: string; // UUID is stored as string
  name: string;
};

export default function TaskDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [task, setTask] = useState<Task | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Define a more specific type for editedTask to include all fields we need to edit
  type EditableTask = {
    title: string | null;
    description: string | null;
    client_id: string; // UUID is stored as string
    status: "Pending" | "In Progress" | "Completed";
    deadline: string | null;
  };

  const [editedTask, setEditedTask] = useState<EditableTask | null>(null);

  useEffect(() => {
    fetchTask();
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTask() {
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
        .eq("id", id)
        .single();

      if (error) throw error;

      setTask(data);
      setEditedTask({
        title: data.title,
        description: data.description,
        client_id: data.client_id,
        status: data.status || "Pending",
        deadline: data.deadline
      });
    } catch (error) {
      console.error("Error fetching task:", error);
      toast({
        variant: "destructive",
        title: "Error loading task",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  }

  async function handleSave() {
    if (!task || !editedTask) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: editedTask.title,
          description: editedTask.description,
          client_id: editedTask.client_id,
          status: editedTask.status,
          deadline: editedTask.deadline
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Task updated successfully",
      });

      fetchTask(); // Refresh the task data
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Task deleted successfully",
      });

      router.push("/tasks");
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        variant: "destructive",
        title: "Error deleting task",
        description: "Please try again later.",
      });
    } finally {
      setDeleting(false);
    }
  }

  function formatTimeAgo(dateString: string | null | undefined) {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  }

  function formatDateTime(dateString: string | null | undefined) {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(date, "PPp"); // "Jan 1, 2023, 12:00 PM"
    } catch (e) {
      return dateString;
    }
  }

  function isPast(date: Date) {
    return date < new Date();
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
        </div>
        <div className="text-center">Loading task details...</div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/tasks">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Tasks
              </Button>
            </Link>
            <h1 className="text-3xl font-bold ml-4">Task Details</h1>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center"
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Task
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="text-center py-8">Task not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tasks
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Task Details</h1>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center"
            >
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit Task
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      {task && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="title">Task Title</Label>
                    <Input
                      id="title"
                      value={editedTask?.title || ""}
                      onChange={(e) => setEditedTask({...editedTask!, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="client">Client</Label>
                    <Select
                      value={editedTask?.client_id ? editedTask.client_id.toString() : ""}
                      onValueChange={(value) => setEditedTask({...editedTask!, client_id: value})}
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedTask?.status || "Pending"}
                      onValueChange={(value: "Pending" | "In Progress" | "Completed") =>
                        setEditedTask({...editedTask!, status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      type="datetime-local"
                      value={editedTask?.deadline ? new Date(editedTask.deadline).toISOString().slice(0, 16) : ""}
                      onChange={(e) => setEditedTask({...editedTask!, deadline: e.target.value})}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Task Title</Label>
                    <p className="mt-1 font-semibold">{task.title}</p>
                  </div>
                  <div>
                    <Label>Client</Label>
                    <p className="mt-1">{task.clients?.name || "Unknown"}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        task.status === "Completed" ? "bg-green-100 text-green-800" :
                        task.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                        "bg-blue-100 text-blue-800"
                      }`}>
                        {task.status}
                      </span>
                    </p>
                  </div>
                  {task.deadline && (
                    <div>
                      <Label className="flex items-center">
                        <CalendarClock className="h-4 w-4 mr-1" /> Deadline
                      </Label>
                      <p className="mt-1">{formatDateTime(task.deadline)}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="description">Description</Label>
                {isEditing ? (
                  <Textarea
                    id="description"
                    className="mt-2"
                    rows={4}
                    value={editedTask?.description || ""}
                    onChange={(e) => setEditedTask({...editedTask!, description: e.target.value})}
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{task.description || "No description available."}</p>
                )}
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Time Tracking</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border rounded p-3">
                    <Label className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-blue-500" /> Start Time
                    </Label>
                    <p className="mt-1">
                      {task.timer_start ? formatDateTime(task.timer_start) : "Not started yet"}
                    </p>
                  </div>
                  <div className="border rounded p-3">
                    <Label className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Completion Time
                    </Label>
                    <p className="mt-1">
                      {task.timer_end ? formatDateTime(task.timer_end) : "Not completed yet"}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Task Metadata</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{formatDateTime(task.created_at)}</p>
                  </div>
                  {task.status === "Completed" && task.timer_start && task.timer_end && (
                    <div>
                      <Label className="text-muted-foreground">Duration</Label>
                      <p>
                        {(() => {
                          try {
                            const start = new Date(task.timer_start);
                            const end = new Date(task.timer_end);
                            const durationMs = end.getTime() - start.getTime();
                            const hours = Math.floor(durationMs / (1000 * 60 * 60));
                            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                            return `${hours}h ${minutes}m`;
                          } catch (e) {
                            return "Unknown";
                          }
                        })()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {!isEditing && task.deadline && task.status !== "Completed" && (
                <div className={`p-4 rounded-md ${
                  new Date(task.deadline) < new Date() ?
                    "bg-red-50 text-red-800 border border-red-200" :
                    "bg-yellow-50 text-yellow-800 border border-yellow-200"
                }`}>
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    <span className="font-medium">
                      {new Date(task.deadline) < new Date()
                        ? "This task is overdue!"
                        : "This task has an upcoming deadline."}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
