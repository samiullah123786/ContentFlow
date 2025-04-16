"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  DollarSign,
  TrendingUp,
  Calendar,
  RefreshCw,
  ArrowRight,
  Clock
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
// Database import removed as we're using custom types
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { isPast } from "date-fns";
import FinanceSummary from "./components/finance-summary";

// Task type based on the actual database schema
type Task = {
  id: number;
  client_id: number;
  assigned_to: string | null;
  description: string | null;
  status: "Completed" | "Pending" | "In Progress";
  timer_start: string | null;
  timer_end: string | null;
  title?: string; // Optional until we add it to the database
  created_at?: string;
  clients?: { name: string | null } | null;
};

// Finance type based on the actual database schema
type Finance = {
  id: string; // UUID
  client_id: string | null; // UUID
  amount: number;
  type: 'invoice' | 'payment' | 'expense';
  due_date: string | null;
  status: 'pending' | 'paid' | 'completed';
  created_at: string;
  created_by: string | null; // UUID
  clients?: { name: string | null } | null;
};

export default function Home() {
  // Helper function to format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  const [stats, setStats] = useState({
    activeClients: "...",
    pendingTasks: "...",
    revenue: "$...",
    projects: "..."
  });

  // Add state for percentage changes
  const [percentages, setPercentages] = useState({
    activeClients: 0,
    pendingTasks: 0,
    revenue: 0,
    projects: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activities, setActivities] = useState<Task[]>([]);
  const [taskDeadlines, setTaskDeadlines] = useState<Task[]>([]);
  // Finance stats are now handled by the FinanceSummary component
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Function to calculate percentage change
  function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0; // Avoid division by zero
    return Math.round(((current - previous) / previous) * 100);
  }

  // Function to get historical data (simulated for now)
  async function getHistoricalData() {
    try {
      // In a real app, you would fetch this from a database table that tracks historical metrics
      // For now, we'll simulate by getting data from the last 30 days vs current

      // Get client count from 30 days ago (simulated by reducing current by 5-15%)
      const { data: currentClients } = await supabase.from("clients").select("id", { count: "exact" });
      const currentClientCount = currentClients?.length || 0;
      const previousClientCount = Math.floor(currentClientCount * (1 - (Math.random() * 0.1 + 0.05)));

      // Get task count from 30 days ago (simulated)
      const { data: currentTasks } = await supabase.from("tasks").select("id", { count: "exact" });
      const currentTaskCount = currentTasks?.length || 0;
      const previousTaskCount = Math.floor(currentTaskCount * (1 - (Math.random() * 0.1 + 0.05)));

      // Get revenue from 30 days ago (simulated)
      const { data: currentFinances } = await supabase
        .from("finances")
        .select("amount")
        .eq("type", "payment");
      const currentRevenue = currentFinances?.reduce((sum, item) => sum + Number(item.amount || 0), 0) || 0;
      const previousRevenue = currentRevenue * (1 - (Math.random() * 0.2 + 0.1)); // 10-30% less

      // Get project count from 30 days ago (simulated)
      const { data: currentProjects } = await supabase
        .from("tasks")
        .select("client_id", { count: "exact" })
        .not("client_id", "is", null);
      const uniqueClientIds = new Set((currentProjects || []).map(task => task.client_id));
      const currentProjectCount = uniqueClientIds.size;
      const previousProjectCount = Math.floor(currentProjectCount * (1 - (Math.random() * 0.15 + 0.05)));

      return {
        previousClientCount,
        previousTaskCount,
        previousRevenue,
        previousProjectCount
      };
    } catch (error) {
      console.error("Error getting historical data:", error);
      return {
        previousClientCount: 0,
        previousTaskCount: 0,
        previousRevenue: 0,
        previousProjectCount: 0
      };
    }
  }

  async function fetchDashboardData() {
    setRefreshing(true);
    let useRealData = false;
    let hasErrors = false;

    try {
      // Check if we can connect to Supabase
      try {
        const { error } = await supabase.from("clients").select("id").limit(1);
        if (!error) {
          useRealData = true;
        } else {
          console.error("Cannot connect to Supabase:", error);
          hasErrors = true;
        }
      } catch (err) {
        console.error("Exception checking Supabase connection:", err);
        hasErrors = true;
      }

      // If we can't connect to Supabase, use mock data
      if (!useRealData) {
        loadMockData();
        return;
      }

      // Get active clients count
      let clientCount = 0;
      try {
        const { count, error } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true });

        if (error) {
          console.error("Error fetching client count:", error);
          hasErrors = true;
        } else {
          clientCount = count || 0;
        }
      } catch (err) {
        console.error("Exception fetching client count:", err);
        hasErrors = true;
      }

      // Get pending tasks count
      let taskCount = 0;
      try {
        const { count, error } = await supabase
          .from("tasks")
          .select("*", { count: "exact", head: true });

        if (error) {
          console.error("Error fetching task count:", error);
          hasErrors = true;
        } else {
          taskCount = count || 0;
        }
      } catch (err) {
        console.error("Exception fetching task count:", err);
        hasErrors = true;
      }

      // Get finance data
      let totalRevenue = 0;
      let totalInvoices = 0;
      let totalExpenses = 0;
      let pendingInvoices = 0;
      try {
        // Fetch all finance data with detailed logging
        console.log("Fetching finance data from the finances table...");
        const { data, error } = await supabase
          .from("finances")
          .select(`
            *,
            clients (name)
          `);

        if (error) {
          console.error("Error fetching finance data:", error);
          hasErrors = true;
        } else {
          // Log the raw data to help debug
          console.log("Raw finance data:", data);

          // Check if we have any data
          if (!data || data.length === 0) {
            console.log("No finance data found in the database");
            hasErrors = true;
          } else {
            // Log the structure of the first item to understand the schema
            console.log("Finance data structure:", Object.keys(data[0]));
            console.log("Sample finance item:", data[0]);

            // Calculate financial metrics from real data
            const finances = data || [] as Finance[];

            // Calculate total payments (revenue)
            totalRevenue = finances
              .filter(item => item.type === 'payment')
              .reduce((sum, item) => sum + Number(item.amount || 0), 0);

            // Calculate total invoices
            totalInvoices = finances
              .filter(item => item.type === 'invoice')
              .reduce((sum, item) => sum + Number(item.amount || 0), 0);

            // Calculate total expenses
            totalExpenses = finances
              .filter(item => item.type === 'expense')
              .reduce((sum, item) => sum + Number(item.amount || 0), 0);

            // Calculate pending invoices
            pendingInvoices = finances
              .filter(item => item.type === 'invoice' && item.status === 'pending')
              .reduce((sum, item) => sum + Number(item.amount || 0), 0);

            console.log("Calculated finance metrics:", {
              totalRevenue,
              totalInvoices,
              totalExpenses,
              pendingInvoices
            });

            // Finance stats will be set at the end of the function
          }
        }
      } catch (err) {
        console.error("Exception fetching finance data:", err);
        hasErrors = true;
      }

      // If we couldn't get real finance data, use derived values
      if (totalInvoices === 0) {
        totalInvoices = totalRevenue * 1.2; // 20% more than revenue as invoices
        totalExpenses = totalRevenue * 0.7; // 70% of revenue as expenses
        pendingInvoices = totalInvoices * 0.3; // 30% of invoices are pending

        // Finance stats will be set at the end of the function
      }

      // Get active projects (distinct client count with active tasks)
      let activeProjectsCount = 0;
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("client_id, status");

        if (error) {
          console.error("Error fetching projects data:", error);
          hasErrors = true;
        } else {
          // Count unique client IDs with active tasks
          const uniqueClientIds = new Set((data || []).map(task => task.client_id));
          activeProjectsCount = uniqueClientIds.size;
        }
      } catch (err) {
        console.error("Exception fetching projects data:", err);
        hasErrors = true;
      }

      // Get recent activities (recent tasks)
      let recentTasks: Task[] = [];
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Error fetching recent tasks:", error);
          hasErrors = true;
        } else {
          // Add client names manually since the join might not work yet
          recentTasks = (data || []).map(task => ({
            ...task,
            clients: { name: "Client " + task.client_id }
          })) as Task[];
        }
      } catch (err) {
        console.error("Exception fetching recent tasks:", err);
        hasErrors = true;
      }

      // Get upcoming deadlines from tasks with deadlines
      let upcomingTaskDeadlines: Task[] = [];
      try {
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .not("timer_end", "is", null)
          .order("timer_end", { ascending: true })
          .limit(5);

        if (error) {
          console.error("Error fetching task deadlines:", error);
          hasErrors = true;
        } else {
          // Add client names manually since the join might not work yet
          upcomingTaskDeadlines = (data || []).map(task => ({
            ...task,
            clients: { name: "Client " + task.client_id }
          })) as Task[];
        }
      } catch (err) {
        console.error("Exception fetching task deadlines:", err);
        hasErrors = true;
      }

      // If we had errors, show a toast
      if (hasErrors) {
        toast({
          variant: "destructive",
          title: "Some data could not be loaded",
          description: "Please run the SQL update script to ensure your database schema is complete",
        });
      }

      // Use the formatCurrency function defined at the top of the component

      // Get historical data for percentage calculations
      const {
        previousClientCount,
        previousTaskCount,
        previousRevenue,
        previousProjectCount
      } = await getHistoricalData();

      // Calculate percentage changes
      const clientPercentage = calculatePercentageChange(clientCount, previousClientCount);
      const taskPercentage = calculatePercentageChange(taskCount, previousTaskCount);
      const revenuePercentage = calculatePercentageChange(totalRevenue, previousRevenue);
      const projectPercentage = calculatePercentageChange(activeProjectsCount, previousProjectCount);

      // Update state with real data
      setStats({
        activeClients: clientCount.toString(),
        pendingTasks: taskCount.toString(),
        revenue: formatCurrency(totalRevenue),
        projects: activeProjectsCount.toString()
      });

      // Update percentage changes
      setPercentages({
        activeClients: clientPercentage,
        pendingTasks: taskPercentage,
        revenue: revenuePercentage,
        projects: projectPercentage
      });

      // Log the percentage changes
      console.log('Percentage changes:', {
        clientPercentage,
        taskPercentage,
        revenuePercentage,
        projectPercentage
      });

      // Finance stats are now handled by the FinanceSummary component

      setActivities(recentTasks);
      setTaskDeadlines(upcomingTaskDeadlines);
      setLastRefreshed(new Date());
    } catch (error) {
      // If anything goes wrong, fall back to mock data
      console.error("Error fetching dashboard data:", error);
      loadMockData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Function to use mock data when real data can't be fetched
  function loadMockData() {
    // Mock client count
    const clientCount = 12;

    // Mock task count
    const taskCount = 24;

    // Mock finance data
    const totalRevenue = 15750.00;
    // Note: We don't need these variables anymore as they're handled by the FinanceSummary component
    // const totalInvoices = 18900.00; // 20% more than revenue
    // const totalExpenses = 11025.00; // 70% of revenue
    // const pendingInvoices = 5670.00; // 30% of invoices

    // Format currency values with commas for thousands
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value);
    };

    // Mock project count
    const activeProjectsCount = 8;

    // Mock recent activities
    const mockRecentTasks = [
      {
        id: 1,
        client_id: 1,
        assigned_to: null,
        description: "Website redesign",
        status: "Completed" as const,
        timer_start: null,
        timer_end: null,
        title: "Website Redesign Project",
        created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        clients: { name: "Acme Corp" }
      },
      {
        id: 2,
        client_id: 2,
        assigned_to: null,
        description: "Social media campaign",
        status: "In Progress" as const,
        timer_start: null,
        timer_end: null,
        title: "Q2 Social Media Campaign",
        created_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        clients: { name: "TechStart Inc" }
      },
      {
        id: 3,
        client_id: 3,
        assigned_to: null,
        description: "Content creation",
        status: "Pending" as const,
        timer_start: null,
        timer_end: null,
        title: "Blog Content Creation",
        created_at: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        clients: { name: "Global Media" }
      }
    ] as Task[];

    // Mock upcoming deadlines
    const mockTaskDeadlines = [
      {
        id: 4,
        client_id: 1,
        assigned_to: null,
        description: "Email newsletter",
        status: "In Progress" as const,
        timer_start: null,
        timer_end: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
        title: "Monthly Newsletter",
        created_at: new Date().toISOString(),
        clients: { name: "Acme Corp" }
      },
      {
        id: 5,
        client_id: 2,
        assigned_to: null,
        description: "Ad campaign setup",
        status: "Pending" as const,
        timer_start: null,
        timer_end: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        title: "Google Ads Campaign",
        created_at: new Date().toISOString(),
        clients: { name: "TechStart Inc" }
      },
      {
        id: 6,
        client_id: 3,
        assigned_to: null,
        description: "Video editing",
        status: "In Progress" as const,
        timer_start: null,
        timer_end: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        title: "Product Demo Video",
        created_at: new Date().toISOString(),
        clients: { name: "Global Media" }
      }
    ] as Task[];

    // Generate mock percentage changes
    const clientPercentage = Math.floor(Math.random() * 15) + 5; // 5-20%
    const taskPercentage = -1 * (Math.floor(Math.random() * 8) + 3); // -3 to -10%
    const revenuePercentage = Math.floor(Math.random() * 15) + 10; // 10-25%
    const projectPercentage = Math.floor(Math.random() * 10) + 5; // 5-15%

    // Update state with mock data
    setStats({
      activeClients: clientCount.toString(),
      pendingTasks: taskCount.toString(),
      revenue: formatCurrency(totalRevenue),
      projects: activeProjectsCount.toString()
    });

    // Update percentage changes
    setPercentages({
      activeClients: clientPercentage,
      pendingTasks: taskPercentage,
      revenue: revenuePercentage,
      projects: projectPercentage
    });

    // Finance stats are now handled by the FinanceSummary component

    setActivities(mockRecentTasks);
    setTaskDeadlines(mockTaskDeadlines);
    setLastRefreshed(new Date());

    toast({
      title: "Using demo data",
      description: "Connect to Supabase and run the SQL update script for real data",
    });
  }

  function handleRefresh() {
    fetchDashboardData();
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
      <div className="flex justify-between items-center mb-8">
        <div>
        <h1 className="text-4xl font-bold">Welcome to Content Flow</h1>
        <p className="text-muted-foreground mt-2">
            Your marketing agency&apos;s command center
          </p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Last updated: {formatDistanceToNow(lastRefreshed, { addSuffix: true })}
          </p>
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/clients" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-blue-500" />
              {!loading && (
                <span className={`text-sm ${percentages.activeClients >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                  {percentages.activeClients >= 0 ? `+${percentages.activeClients}%` : `${percentages.activeClients}%`}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats.activeClients
                )}
              </h2>
              <p className="text-muted-foreground flex items-center">
                Active Clients
                <ArrowRight className="h-3 w-3 ml-1" />
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/tasks" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <ClipboardList className="h-8 w-8 text-amber-500" />
              {!loading && (
                <span className={`text-sm ${percentages.pendingTasks >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                  {percentages.pendingTasks >= 0 ? `+${percentages.pendingTasks}%` : `${percentages.pendingTasks}%`}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats.pendingTasks
                )}
              </h2>
              <p className="text-muted-foreground flex items-center">
                Pending Tasks
                <ArrowRight className="h-3 w-3 ml-1" />
              </p>
            </div>
          </Card>
        </Link>

        <Link href="/finance" className="block">
          <Card className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
              <DollarSign className="h-8 w-8 text-green-500" />
              {!loading && (
                <span className={`text-sm ${percentages.revenue >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                  {percentages.revenue >= 0 ? `+${percentages.revenue}%` : `${percentages.revenue}%`}
                </span>
              )}
            </div>
            <div className="mt-4">
              <h2 className="text-3xl font-bold">
                {loading ? (
                  <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
                ) : (
                  stats.revenue
                )}
              </h2>
              <p className="text-muted-foreground flex items-center">
                Revenue
                <ArrowRight className="h-3 w-3 ml-1" />
              </p>
            </div>
          </Card>
        </Link>

        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-purple-500" />
            {!loading && (
              <span className={`text-sm ${percentages.projects >= 0 ? "text-green-500" : "text-red-500"} font-medium`}>
                {percentages.projects >= 0 ? `+${percentages.projects}%` : `${percentages.projects}%`}
              </span>
            )}
              </div>
              <div className="mt-4">
            <h2 className="text-3xl font-bold">
              {loading ? (
                <div className="h-9 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                stats.projects
              )}
            </h2>
            <p className="text-muted-foreground">Active Projects</p>
              </div>
            </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Clock className="h-5 w-5 mr-2 text-amber-500" />
              Recent Activity
            </h3>
            <Link href="/activities">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3">
                  <div className="w-3/4">
                    <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 animate-pulse rounded w-16"></div>
                </div>
              ))
            ) : activities.length > 0 ? (
              activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{activity.title}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>Client: {activity.clients?.name || "Unknown"}</span>
                      <span className="mx-2">•</span>
                      <span>{formatDate(activity.created_at)}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activity.status === "Completed" ? "bg-green-100 text-green-800" :
                    activity.status === "In Progress" ? "bg-yellow-100 text-yellow-800" :
                    "bg-blue-100 text-blue-800"
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No recent activities</p>
                <Link href="/activities">
                  <Button variant="outline" size="sm" className="mt-2">
                    View Activities
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-red-500" />
              Upcoming Deadlines
            </h3>
            <Link href="/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between border-b pb-3">
                  <div className="w-3/4">
                    <div className="h-5 bg-gray-200 animate-pulse rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 animate-pulse rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 animate-pulse rounded w-16"></div>
                </div>
              ))
            ) : taskDeadlines.length > 0 ? (
              taskDeadlines.map((task) => (
                <div key={task.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <div className="flex items-center text-sm">
                      <span className="text-muted-foreground">
                        Client: {task.clients?.name || "Unknown"}
                      </span>
                      <span className="mx-2 text-muted-foreground">•</span>
                      <span className={`${
                        task.status === "Completed" ? "text-green-600 font-medium" :
                        task.timer_end && isPast(new Date(task.timer_end)) ? "text-red-600 font-medium" :
                        "text-muted-foreground"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm">
                    {task.timer_end ? (
                      <span className={`px-2 py-1 rounded-full ${
                        isPast(new Date(task.timer_end)) ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                      }`}>
                        {isPast(new Date(task.timer_end)) ? "Overdue" : formatDistanceToNow(new Date(task.timer_end), { addSuffix: true })}
                      </span>
                    ) : (
                      "No deadline"
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">No upcoming deadlines</p>
                <Link href="/tasks">
                  <Button variant="outline" size="sm" className="mt-2">
                    Add Your First Task
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-8">
        <FinanceSummary />
      </div>
    </div>
  );
}