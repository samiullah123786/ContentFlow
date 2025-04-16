"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Calendar, Clock, Filter } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Task type to match our database schema
type Task = {
  id: number;
  client_id: number;
  assigned_to: string | null;
  description: string | null;
  status: "Completed" | "Pending" | "In Progress";
  timer_start: string | null;
  timer_end: string | null;
  title?: string;
  created_at?: string;
  clients?: { name: string | null } | null;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, sortBy]);

  async function fetchActivities() {
    setIsLoading(true);
    try {
      let query = supabase
        .from("tasks")
        .select("*, clients(name)");

      // Apply status filter if not "all"
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "oldest") {
        query = query.order("created_at", { ascending: true });
      } else if (sortBy === "deadline") {
        query = query.order("timer_end", { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Add client names manually if the join didn't work
      const activitiesWithClients = (data || []).map(task => {
        if (!task.clients) {
          return {
            ...task,
            clients: { name: `Client ${task.client_id}` }
          };
        }
        return task;
      });

      setActivities(activitiesWithClients as Task[]);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast({
        variant: "destructive",
        title: "Error loading activities",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string | null | undefined) {
    if (!dateString) return "No date";
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-8">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <h1 className="text-3xl font-bold ml-4">Recent Activities</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-48">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <Label htmlFor="sort-by">Sort By</Label>
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
              <SelectTrigger id="sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button 
          onClick={fetchActivities}
          className="self-end"
        >
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">No activities found.</div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="p-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <h3 className="text-lg font-semibold">
                    {activity.title || activity.description || `Task #${activity.id}`}
                  </h3>
                  <p className="text-muted-foreground">
                    Client: {activity.clients?.name || `Client ${activity.client_id}`}
                  </p>
                  {activity.description && (
                    <p className="mt-2">{activity.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-start md:items-end mt-2 md:mt-0 space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activity.status === "Completed" ? "bg-green-100 text-green-800" :
                    activity.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {activity.status}
                  </span>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {formatDate(activity.created_at)}
                  </div>
                  {activity.timer_end && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Due {formatDate(activity.timer_end)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
