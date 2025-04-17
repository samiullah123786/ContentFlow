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
import {
  Briefcase,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  Plus,
  Trash2,
  User,
  FileText,
  ExternalLink,
  Edit,
  Save,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  resources?: { name: string } | null;
};

type WorkDocument = {
  id: string;
  work_id: string;
  title: string;
  url: string;
  description: string | null;
  document_type: string;
};

export default function WorkDetailsClient({ id }: { id: string }) {
  // State
  const [work, setWork] = useState<Work | null>(null);
  const [editedWork, setEditedWork] = useState<Work | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [resources, setResources] = useState<WorkResource[]>([]);
  const [expenses, setExpenses] = useState<WorkExpense[]>([]);
  const [documents, setDocuments] = useState<WorkDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // New resource state
  const [newResource, setNewResource] = useState({
    name: "",
    role: "",
    contact_info: "",
    rate: "",
    notes: "",
  });
  const [isAddResourceDialogOpen, setIsAddResourceDialogOpen] = useState(false);

  // New expense state
  const [newExpense, setNewExpense] = useState({
    category: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split('T')[0],
    resource_id: "none", // Using "none" instead of empty string
    expense_type: "service", // New field: service, material, travel, other
    payment_status: "paid", // New field: paid, pending, invoiced
  });
  const [isAddExpenseDialogOpen, setIsAddExpenseDialogOpen] = useState(false);

  // New document state
  const [newDocument, setNewDocument] = useState({
    title: "",
    url: "",
    description: "",
    document_type: "link",
  });
  const [isAddDocumentDialogOpen, setIsAddDocumentDialogOpen] = useState(false);

  const { toast } = useToast();

  // Fetch work details on component mount
  useEffect(() => {
    fetchWorkDetails();
    fetchClients();
  }, [id]);

  // Fetch work details from the database
  async function fetchWorkDetails() {
    setLoading(true);
    try {
      // Fetch work details
      const { data: workData, error: workError } = await supabase
        .from("works")
        .select(`
          *,
          clients (
            name
          )
        `)
        .eq("id", id)
        .single();

      if (workError) throw workError;
      setWork(workData);
      setEditedWork(workData);

      // Fetch resources
      const { data: resourcesData, error: resourcesError } = await supabase
        .from("work_resources")
        .select("*")
        .eq("work_id", id)
        .order("name");

      if (resourcesError) throw resourcesError;
      setResources(resourcesData || []);

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from("work_expenses")
        .select(`
          *,
          resources:work_resources (
            name
          )
        `)
        .eq("work_id", id)
        .order("date", { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Fetch documents
      const { data: documentsData, error: documentsError } = await supabase
        .from("work_documents")
        .select("*")
        .eq("work_id", id)
        .order("created_at", { ascending: false });

      if (documentsError) throw documentsError;
      setDocuments(documentsData || []);

    } catch (error) {
      console.error("Error fetching work details:", error);
      toast({
        variant: "destructive",
        title: "Error fetching work details",
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

  // Handle saving work details
  async function handleSave() {
    if (!editedWork) return;

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("works")
        .update({
          title: editedWork.title,
          description: editedWork.description,
          client_id: editedWork.client_id,
          status: editedWork.status,
          start_date: editedWork.start_date,
          deadline: editedWork.deadline,
          completion_date: editedWork.completion_date,
          total_budget: editedWork.total_budget,
          remaining_budget: editedWork.remaining_budget,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Work details updated successfully",
      });

      setIsEditing(false);
      fetchWorkDetails();
    } catch (error) {
      console.error("Error updating work details:", error);
      toast({
        variant: "destructive",
        title: "Error updating work details",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting work
  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this work? This action cannot be undone and will delete all associated resources, expenses, and documents.")) {
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

      // Redirect to works list
      window.location.href = "/works";
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

  // Handle adding a new resource
  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();

    if (!newResource.name || !newResource.role) {
      toast({
        variant: "destructive",
        title: "Name and role are required",
        description: "Please provide a name and role for the resource.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.from("work_resources").insert({
        work_id: id,
        name: newResource.name,
        role: newResource.role,
        contact_info: newResource.contact_info || null,
        rate: newResource.rate ? parseFloat(newResource.rate) : null,
        notes: newResource.notes || null,
      }).select();

      if (error) throw error;

      toast({
        title: "Resource added successfully",
      });

      setNewResource({
        name: "",
        role: "",
        contact_info: "",
        rate: "",
        notes: "",
      });
      setIsAddResourceDialogOpen(false);
      fetchWorkDetails();
    } catch (error) {
      console.error("Error adding resource:", error);
      toast({
        variant: "destructive",
        title: "Error adding resource",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting a resource
  async function handleDeleteResource(resourceId: string) {
    if (!confirm("Are you sure you want to delete this resource? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("work_resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;

      toast({
        title: "Resource deleted successfully",
      });

      fetchWorkDetails();
    } catch (error) {
      console.error("Error deleting resource:", error);
      toast({
        variant: "destructive",
        title: "Error deleting resource",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle adding a new expense
  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();

    if (!newExpense.category || !newExpense.amount) {
      toast({
        variant: "destructive",
        title: "Category and amount are required",
        description: "Please provide a category and amount for the expense.",
      });
      return;
    }

    setActionLoading(true);
    try {
      // Calculate new remaining budget
      const expenseAmount = parseFloat(newExpense.amount);
      let newRemainingBudget = work?.remaining_budget;

      if (newRemainingBudget !== null && !isNaN(expenseAmount)) {
        newRemainingBudget -= expenseAmount;

        // Update the work's remaining budget
        const { error: updateError } = await supabase
          .from("works")
          .update({ remaining_budget: newRemainingBudget })
          .eq("id", id);

        if (updateError) throw updateError;
      }

      // Add the expense
      const { data, error } = await supabase.from("work_expenses").insert({
        work_id: id,
        category: newExpense.category,
        amount: expenseAmount,
        description: newExpense.description || null,
        date: newExpense.date,
        resource_id: newExpense.resource_id === "none" ? null : newExpense.resource_id,
        expense_type: newExpense.expense_type,
        payment_status: newExpense.payment_status,
      }).select();

      if (error) throw error;

      toast({
        title: "Expense added successfully",
      });

      setNewExpense({
        category: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split('T')[0],
        resource_id: "none",
        expense_type: "service",
        payment_status: "paid",
      });
      setIsAddExpenseDialogOpen(false);
      fetchWorkDetails();
    } catch (error) {
      console.error("Error adding expense:", error);
      toast({
        variant: "destructive",
        title: "Error adding expense",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting an expense
  async function handleDeleteExpense(expenseId: string, amount: number) {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      // Update the remaining budget
      let newRemainingBudget = work?.remaining_budget;

      if (newRemainingBudget !== null) {
        newRemainingBudget += amount;

        // Update the work's remaining budget
        const { error: updateError } = await supabase
          .from("works")
          .update({ remaining_budget: newRemainingBudget })
          .eq("id", id);

        if (updateError) throw updateError;
      }

      // Delete the expense
      const { error } = await supabase
        .from("work_expenses")
        .delete()
        .eq("id", expenseId);

      if (error) throw error;

      toast({
        title: "Expense deleted successfully",
      });

      fetchWorkDetails();
    } catch (error) {
      console.error("Error deleting expense:", error);
      toast({
        variant: "destructive",
        title: "Error deleting expense",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle adding a new document
  async function handleAddDocument(e: React.FormEvent) {
    e.preventDefault();

    if (!newDocument.title || !newDocument.url) {
      toast({
        variant: "destructive",
        title: "Title and URL are required",
        description: "Please provide a title and URL for the document.",
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data, error } = await supabase.from("work_documents").insert({
        work_id: id,
        title: newDocument.title,
        url: newDocument.url,
        description: newDocument.description || null,
        document_type: newDocument.document_type,
      }).select();

      if (error) throw error;

      toast({
        title: "Document added successfully",
      });

      setNewDocument({
        title: "",
        url: "",
        description: "",
        document_type: "link",
      });
      setIsAddDocumentDialogOpen(false);
      fetchWorkDetails();
    } catch (error) {
      console.error("Error adding document:", error);
      toast({
        variant: "destructive",
        title: "Error adding document",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Handle deleting a document
  async function handleDeleteDocument(documentId: string) {
    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("work_documents")
        .delete()
        .eq("id", documentId);

      if (error) throw error;

      toast({
        title: "Document deleted successfully",
      });

      fetchWorkDetails();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Error deleting document",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Helper functions
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

  function formatCurrency(amount: number | null) {
    if (amount === null) return "-";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  function calculateBudgetProgress() {
    if (!work || work.total_budget === null) return 0;
    if (work.total_budget === 0) return 100;

    const spent = work.total_budget - (work.remaining_budget || 0);
    const percentage = (spent / work.total_budget) * 100;
    return Math.min(Math.max(percentage, 0), 100);
  }

  function getTotalSpent() {
    if (!work || work.total_budget === null || work.remaining_budget === null) return 0;
    return work.total_budget - work.remaining_budget;
  }

  function getSpendingByCategory() {
    if (!expenses || expenses.length === 0) return [];

    const categories: {[key: string]: number} = {};

    expenses.forEach(expense => {
      if (!categories[expense.category]) {
        categories[expense.category] = 0;
      }
      categories[expense.category] += expense.amount;
    });

    return Object.entries(categories).map(([category, amount]) => ({
      category,
      amount,
      percentage: work?.total_budget ? (amount / work.total_budget) * 100 : 0
    }));
  }

  function getSpendingByResource() {
    if (!expenses || expenses.length === 0) return [];

    const resourceSpending: {[key: string]: number} = {};

    expenses.forEach(expense => {
      if (expense.resource_id) {
        const resourceName = expense.resources?.name || 'Unknown';
        if (!resourceSpending[resourceName]) {
          resourceSpending[resourceName] = 0;
        }
        resourceSpending[resourceName] += expense.amount;
      }
    });

    return Object.entries(resourceSpending).map(([name, amount]) => ({
      name,
      amount,
      percentage: work?.total_budget ? (amount / work.total_budget) * 100 : 0
    }));
  }

  function getDocumentIcon(type: string) {
    switch (type) {
      case "google_doc":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "spreadsheet":
        return <FileText className="h-4 w-4 text-green-500" />;
      case "presentation":
        return <FileText className="h-4 w-4 text-yellow-500" />;
      default:
        return <LinkIcon className="h-4 w-4 text-gray-500" />;
    }
  }

  // If loading, show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Loading Work Details...</h1>
        </div>
        <Card className="p-6">
          <div className="text-center py-4">Loading work details...</div>
        </Card>
      </div>
    );
  }

  // If work not found, show error
  if (!work) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Work Not Found</h1>
        </div>
        <Card className="p-6">
          <div className="text-center py-4">
            <p className="text-muted-foreground">The requested work could not be found.</p>
            <Button
              className="mt-4"
              onClick={() => window.location.href = "/works"}
            >
              Back to Works
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Main UI
  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold mr-3">{work.title}</h1>
          <Badge className={getStatusColor(work.status)}>
            {work.status.replace("_", " ").charAt(0).toUpperCase() + work.status.replace("_", " ").slice(1)}
          </Badge>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedWork(work);
                }}
                disabled={actionLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={actionLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={actionLoading}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {actionLoading ? "Deleting..." : "Delete"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Client and Budget Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-500" />
            Client
          </h3>
          <p className="text-xl font-bold">{work.clients?.name || "No client"}</p>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-500" />
            Budget
          </h3>
          <p className="text-xl font-bold">{formatCurrency(work.total_budget)}</p>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span>Remaining: {formatCurrency(work.remaining_budget)}</span>
              <span>
                {work.total_budget !== null && work.remaining_budget !== null
                  ? Math.round((work.remaining_budget / work.total_budget) * 100)
                  : 0}%
              </span>
            </div>
            <Progress value={100 - calculateBudgetProgress()} className="h-2" />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-purple-500" />
            Timeline
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-muted-foreground">Start Date</p>
              <p className="font-medium">
                {work.start_date
                  ? format(new Date(work.start_date), "MMM d, yyyy")
                  : "Not set"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deadline</p>
              <p className="font-medium">
                {work.deadline
                  ? format(new Date(work.deadline), "MMM d, yyyy")
                  : "Not set"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <Card className="p-6">
            {isEditing ? (
              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={editedWork?.title || ""}
                    onChange={(e) => setEditedWork({...editedWork!, title: e.target.value})}
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
                    value={editedWork?.description || ""}
                    onChange={(e) => setEditedWork({...editedWork!, description: e.target.value})}
                    className="col-span-3"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="client" className="text-right">
                    Client
                  </Label>
                  <Select
                    value={editedWork?.client_id || ""}
                    onValueChange={(value) => setEditedWork({...editedWork!, client_id: value})}
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
                    value={editedWork?.status || "planned"}
                    onValueChange={(value: "planned" | "in_progress" | "completed" | "canceled") =>
                      setEditedWork({...editedWork!, status: value})}
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
                    value={editedWork?.start_date || ""}
                    onChange={(e) => setEditedWork({...editedWork!, start_date: e.target.value})}
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
                    value={editedWork?.deadline || ""}
                    onChange={(e) => setEditedWork({...editedWork!, deadline: e.target.value})}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="completion_date" className="text-right">
                    Completion Date
                  </Label>
                  <Input
                    id="completion_date"
                    type="date"
                    value={editedWork?.completion_date || ""}
                    onChange={(e) => setEditedWork({...editedWork!, completion_date: e.target.value})}
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
                    value={editedWork?.total_budget || ""}
                    onChange={(e) => setEditedWork({...editedWork!, total_budget: parseFloat(e.target.value) || null})}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl font-bold mb-4">{work.title}</h2>
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {work.description || "No description provided."}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Work Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusColor(work.status)}>
                          {work.status.replace("_", " ").charAt(0).toUpperCase() + work.status.replace("_", " ").slice(1)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Client:</span>
                        <span>{work.clients?.name || "No client"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created:</span>
                        <span>{format(new Date(work.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Timeline</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Start Date:</span>
                        <span>
                          {work.start_date
                            ? format(new Date(work.start_date), "MMM d, yyyy")
                            : "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deadline:</span>
                        <span>
                          {work.deadline
                            ? format(new Date(work.deadline), "MMM d, yyyy")
                            : "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Completion Date:</span>
                        <span>
                          {work.completion_date
                            ? format(new Date(work.completion_date), "MMM d, yyyy")
                            : "Not set"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Hired Personnel</h3>
              <Dialog open={isAddResourceDialogOpen} onOpenChange={setIsAddResourceDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resource
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Resource</DialogTitle>
                    <DialogDescription>
                      Add details about a person hired for this work.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddResource}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                          Name
                        </Label>
                        <Input
                          id="name"
                          value={newResource.name}
                          onChange={(e) => setNewResource({...newResource, name: e.target.value})}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">
                          Role
                        </Label>
                        <Input
                          id="role"
                          value={newResource.role}
                          onChange={(e) => setNewResource({...newResource, role: e.target.value})}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="contact_info" className="text-right">
                          Contact Info
                        </Label>
                        <Input
                          id="contact_info"
                          value={newResource.contact_info}
                          onChange={(e) => setNewResource({...newResource, contact_info: e.target.value})}
                          className="col-span-3"
                          placeholder="Email or phone"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="rate" className="text-right">
                          Rate
                        </Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newResource.rate}
                          onChange={(e) => setNewResource({...newResource, rate: e.target.value})}
                          className="col-span-3"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="notes" className="text-right pt-2">
                          Notes
                        </Label>
                        <Textarea
                          id="notes"
                          value={newResource.notes}
                          onChange={(e) => setNewResource({...newResource, notes: e.target.value})}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Adding..." : "Add Resource"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {resources.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">No resources added yet.</p>
                <p className="text-sm text-muted-foreground mb-4">Add details about people hired for this work.</p>
                <Button
                  variant="outline"
                  onClick={() => setIsAddResourceDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Resource
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {resources.map((resource) => (
                  <div key={resource.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-semibold">{resource.name}</h4>
                        <p className="text-sm text-muted-foreground">{resource.role}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteResource(resource.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {resource.contact_info && (
                        <div>
                          <p className="text-sm text-muted-foreground">Contact</p>
                          <p>{resource.contact_info}</p>
                        </div>
                      )}
                      {resource.rate !== null && (
                        <div>
                          <p className="text-sm text-muted-foreground">Rate</p>
                          <p>{formatCurrency(resource.rate)}</p>
                        </div>
                      )}
                    </div>
                    {resource.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-muted-foreground">Notes</p>
                        <p className="whitespace-pre-wrap">{resource.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Expenses Tab */}
        <TabsContent value="expenses" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Expenses</h3>
              <Dialog open={isAddExpenseDialogOpen} onOpenChange={setIsAddExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Expense</DialogTitle>
                    <DialogDescription>
                      Record an expense for this work.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">
                          Category
                        </Label>
                        <Input
                          id="category"
                          value={newExpense.category}
                          onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                          className="col-span-3"
                          required
                          placeholder="e.g., Design, Development, Marketing"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="amount" className="text-right">
                          Amount
                        </Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newExpense.amount}
                          onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                          className="col-span-3"
                          required
                          placeholder="0.00"
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">
                          Date
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={newExpense.date}
                          onChange={(e) => setNewExpense({...newExpense, date: e.target.value})}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="resource" className="text-right">
                          Resource
                        </Label>
                        <Select
                          value={newExpense.resource_id}
                          onValueChange={(value) => setNewExpense({...newExpense, resource_id: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a resource (optional)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {resources.map((resource) => (
                              <SelectItem key={resource.id} value={resource.id}>
                                {resource.name} ({resource.role})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expense_type" className="text-right">
                          Expense Type
                        </Label>
                        <Select
                          value={newExpense.expense_type}
                          onValueChange={(value) => setNewExpense({...newExpense, expense_type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select expense type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="travel">Travel</SelectItem>
                            <SelectItem value="software">Software</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="payment_status" className="text-right">
                          Payment Status
                        </Label>
                        <Select
                          value={newExpense.payment_status}
                          onValueChange={(value) => setNewExpense({...newExpense, payment_status: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="paid">Paid</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="invoiced">Invoiced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={newExpense.description}
                          onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Adding..." : "Add Expense"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">No expenses recorded yet.</p>
                <p className="text-sm text-muted-foreground mb-4">Track your spending for this work.</p>
                <Button
                  variant="outline"
                  onClick={() => setIsAddExpenseDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Record First Expense
                </Button>
              </div>
            ) : (
              <div>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Budget Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-xl font-bold">{formatCurrency(work.total_budget)}</p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                      <p className="text-xl font-bold">
                        {formatCurrency(getTotalSpent())}
                      </p>
                    </div>
                    <div className="border rounded-lg p-3">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-xl font-bold">{formatCurrency(work.remaining_budget)}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Budget Utilization</span>
                      <span>{Math.round(calculateBudgetProgress())}%</span>
                    </div>
                    <Progress value={calculateBudgetProgress()} className="h-2" />
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2">Spending Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Spending by Category */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">By Category</h5>
                      {getSpendingByCategory().length > 0 ? (
                        <div className="space-y-3">
                          {getSpendingByCategory().map((item, index) => (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{item.category}</span>
                                <span>{formatCurrency(item.amount)} ({Math.round(item.percentage)}%)</span>
                              </div>
                              <Progress value={item.percentage} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No category data available</p>
                      )}
                    </div>

                    {/* Spending by Resource */}
                    <div className="border rounded-lg p-4">
                      <h5 className="font-medium mb-3">By Resource</h5>
                      {getSpendingByResource().length > 0 ? (
                        <div className="space-y-3">
                          {getSpendingByResource().map((item, index) => (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{item.name}</span>
                                <span>{formatCurrency(item.amount)} ({Math.round(item.percentage)}%)</span>
                              </div>
                              <Progress value={item.percentage} className="h-1.5" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No resource spending data available</p>
                      )}
                    </div>
                  </div>
                </div>

                <h4 className="text-lg font-semibold mb-2">Expense History</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {format(new Date(expense.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell className="capitalize">{expense.expense_type || "service"}</TableCell>
                        <TableCell>{expense.description || "-"}</TableCell>
                        <TableCell>{expense.resources?.name || "-"}</TableCell>
                        <TableCell className="font-medium">{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>
                          <Badge className={
                            expense.payment_status === "paid" ? "bg-green-100 text-green-800" :
                            expense.payment_status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            "bg-blue-100 text-blue-800"
                          }>
                            {expense.payment_status || "paid"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(expense.id, expense.amount)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Documents & Links</h3>
              <Dialog open={isAddDocumentDialogOpen} onOpenChange={setIsAddDocumentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Add New Document or Link</DialogTitle>
                    <DialogDescription>
                      Add a link to an external document or resource.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddDocument}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">
                          Title
                        </Label>
                        <Input
                          id="title"
                          value={newDocument.title}
                          onChange={(e) => setNewDocument({...newDocument, title: e.target.value})}
                          className="col-span-3"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="url" className="text-right">
                          URL
                        </Label>
                        <Input
                          id="url"
                          value={newDocument.url}
                          onChange={(e) => setNewDocument({...newDocument, url: e.target.value})}
                          className="col-span-3"
                          required
                          placeholder="https://..."
                        />
                      </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="document_type" className="text-right">
                          Type
                        </Label>
                        <Select
                          value={newDocument.document_type}
                          onValueChange={(value) => setNewDocument({...newDocument, document_type: value})}
                        >
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="link">General Link</SelectItem>
                            <SelectItem value="google_doc">Google Document</SelectItem>
                            <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                            <SelectItem value="presentation">Presentation</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="description" className="text-right pt-2">
                          Description
                        </Label>
                        <Textarea
                          id="description"
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                          className="col-span-3"
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Adding..." : "Add Document"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <LinkIcon className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-2" />
                <p className="text-muted-foreground">No documents or links added yet.</p>
                <p className="text-sm text-muted-foreground mb-4">Add links to Google Docs, spreadsheets, or other resources.</p>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDocumentDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map((document) => (
                  <div key={document.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-start">
                        <div className="mr-3 mt-1">
                          {getDocumentIcon(document.document_type)}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold">{document.title}</h4>
                          {document.description && (
                            <p className="text-sm text-muted-foreground mt-1">{document.description}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4">
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open Document
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
