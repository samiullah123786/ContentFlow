"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { format, parseISO } from "date-fns";
import { Briefcase, Calendar, DollarSign, Link, Plus, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Types
type Client = {
  id: string;
  name: string;
};

type Work = {
  id: string;
  title: string;
  description: string;
  client_id: string;
  status: "planned" | "in_progress" | "completed" | "canceled";
  start_date: string | null;
  deadline: string | null;
  completion_date: string | null;
  total_budget: number | null;
  remaining_budget: number | null;
  created_at: string;
  clients?: { name: string } | null;
};

type WorkResource = {
  id: string;
  work_id: string;
  name: string;
  role: string;
  contact_info: string | null;
  rate: number | null;
  notes: string | null;
};

type WorkExpense = {
  id: string;
  work_id: string;
  category: string;
  amount: number;
  description: string | null;
  date: string;
  resource_id: string | null;
};

type WorkDocument = {
  id: string;
  work_id: string;
  title: string;
  url: string;
  description: string | null;
  document_type: string;
};

export default function WorksPage() {
  // State
  const [works, setWorks] = useState<Work[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [newWork, setNewWork] = useState({
    title: "",
    description: "",
    client_id: "",
    status: "planned" as "planned" | "in_progress" | "completed" | "canceled",
    start_date: "",
    deadline: "",
    total_budget: "",
  });
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch works and clients on component mount
  useEffect(() => {
    fetchWorks();
    fetchClients();
  }, []);

  // Fetch works from the database
  async function fetchWorks() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("works")
        .select(`
          *,
          clients (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWorks(data || []);
    } catch (error) {
      console.error("Error fetching works:", error);
      toast({
        variant: "destructive",
        title: "Error fetching works",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  // Fetch clients from the database
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

  // Handle adding a new work
  async function handleAddWork(e: React.FormEvent) {
    e.preventDefault();
    
    if (!newWork.client_id) {
      toast({
        variant: "destructive",
        title: "Please select a client",
        description: "A client must be selected to create a work.",
      });
      return;
    }
    
    setActionLoading(true);

    try {
      // Calculate remaining budget (initially same as total budget)
      const totalBudget = newWork.total_budget ? parseFloat(newWork.total_budget) : null;
      
      const { data, error } = await supabase.from("works").insert({
        title: newWork.title,
        description: newWork.description,
        client_id: newWork.client_id,
        status: newWork.status,
        start_date: newWork.start_date || null,
        deadline: newWork.deadline || null,
        total_budget: totalBudget,
        remaining_budget: totalBudget,
      }).select();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast({
        title: "Work added successfully",
      });
      
      setNewWork({ 
        title: "", 
        description: "", 
        client_id: "",
        status: "planned",
        start_date: "",
        deadline: "",
        total_budget: "",
      });
      setIsAddDialogOpen(false);
      fetchWorks();
    } catch (error) {
      console.error("Error adding work:", error);
      toast({
        variant: "destructive",
        title: "Error adding work",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting a work
  async function handleDeleteWork(id: string) {
    if (!confirm("Are you sure you want to delete this work? This action cannot be undone.")) {
      return;
    }
    
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("works")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast({
        title: "Work deleted successfully",
      });
      
      fetchWorks();
    } catch (error) {
      console.error("Error deleting work:", error);
      toast({
        variant: "destructive",
        title: "Error deleting work",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Get status badge color
  function getStatusColor(status: string) {
    switch (status) {
      case "planned":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "canceled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  // Format currency
  function formatCurrency(amount: number | null) {
    if (amount === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Work Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add New Work
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Work</DialogTitle>
              <DialogDescription>
                Create a new work item for a client. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddWork}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newWork.title}
                    onChange={(e) => setNewWork({...newWork, title: e.target.value})}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newWork.description}
                    onChange={(e) => setNewWork({...newWork, description: e.target.value})}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Select
                    value={newWork.client_id}
                    onValueChange={(value) => setNewWork({...newWork, client_id: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={newWork.status}
                    onValueChange={(value: "planned" | "in_progress" | "completed" | "canceled") => 
                      setNewWork({...newWork, status: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="start_date" className="text-right">
                    Start Date
                  </Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={newWork.start_date}
                    onChange={(e) => setNewWork({...newWork, start_date: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="deadline" className="text-right">
                    Deadline
                  </Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newWork.deadline}
                    onChange={(e) => setNewWork({...newWork, deadline: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="total_budget" className="text-right">
                    Total Budget
                  </Label>
                  <Input
                    id="total_budget"
                    type="number"
                    step="0.01"
                    value={newWork.total_budget}
                    onChange={(e) => setNewWork({...newWork, total_budget: e.target.value})}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Adding..." : "Add Work"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        {loading ? (
          <div className="text-center py-4">Loading works...</div>
        ) : works.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">No works found. Add your first work item.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {works.map((work) => (
                <TableRow key={work.id}>
                  <TableCell className="font-medium">{work.title}</TableCell>
                  <TableCell>{work.clients?.name}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(work.status)}>
                      {work.status.replace("_", " ").charAt(0).toUpperCase() + work.status.replace("_", " ").slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {work.deadline ? format(new Date(work.deadline), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell>{formatCurrency(work.total_budget)}</TableCell>
                  <TableCell>{formatCurrency(work.remaining_budget)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.href = `/works/${work.id}`}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteWork(work.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
