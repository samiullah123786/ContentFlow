"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Database } from "@/lib/database.types";
import { Edit, Trash2, DollarSign, CheckCircle2, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type Finance = Database["public"]["Tables"]["finances"]["Row"] & {
  clients?: { name: string | null } | null;
};
type Client = Database["public"]["Tables"]["clients"]["Row"];
type PartialClient = Pick<Client, 'id' | 'name'>;

export default function FinancePage() {
  const [finances, setFinances] = useState<Finance[]>([]);
  const [clients, setClients] = useState<PartialClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editingFinance, setEditingFinance] = useState<Finance | null>(null);
  const [newFinance, setNewFinance] = useState({
    client_id: "",
    amount: "",
    type: "invoice" as "invoice" | "payment" | "expense",
    due_date: "",
    status: "pending" as "pending" | "paid" | "overdue",
  });
  // Add state for finance summary
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [pendingInvoices, setPendingInvoices] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinances();
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  async function fetchFinances() {
    try {
      const { data, error } = await supabase
        .from("finances")
        .select(`
          *,
          clients (
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Set the finances data
      const financeData = data || [];
      setFinances(financeData);

      // Calculate finance summary metrics
      let invoicesTotal = 0;
      let paymentsTotal = 0;
      let expensesTotal = 0;
      let pendingInvoicesTotal = 0;

      financeData.forEach(item => {
        const amount = Number(item.amount || 0);

        if (item.type === 'invoice') {
          invoicesTotal += amount;
          if (item.status === 'pending') {
            pendingInvoicesTotal += amount;
          }
        } else if (item.type === 'payment') {
          paymentsTotal += amount;
        } else if (item.type === 'expense') {
          expensesTotal += amount;
        }
      });

      // Update the finance summary state
      setTotalInvoices(invoicesTotal);
      setTotalPayments(paymentsTotal);
      setTotalExpenses(expensesTotal);
      setPendingInvoices(pendingInvoicesTotal);

      console.log('Finance summary calculated:', {
        invoicesTotal,
        paymentsTotal,
        expensesTotal,
        pendingInvoicesTotal
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error fetching finances",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleEditFinance(finance: Finance) {
    setEditingFinance(finance);
    setNewFinance({
      client_id: finance.client_id,
      amount: finance.amount.toString(),
      type: finance.type as "invoice" | "payment" | "expense",
      due_date: finance.due_date || "",
      status: finance.status as "pending" | "paid" | "overdue",
    });
  }

  async function handleUpdateFinance(e: React.FormEvent) {
    e.preventDefault();

    if (!editingFinance) return;

    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("finances")
        .update({
          client_id: newFinance.client_id,
          amount: parseFloat(newFinance.amount),
          type: newFinance.type,
          due_date: newFinance.due_date || null,
          status: newFinance.status,
        })
        .eq("id", editingFinance.id);

      if (error) throw error;

      toast({
        title: "Finance record updated successfully",
      });

      setNewFinance({
        client_id: "",
        amount: "",
        type: "invoice",
        due_date: "",
        status: "pending",
      });
      setEditingFinance(null);
      fetchFinances();
    } catch (error) {
      console.error("Error updating finance record:", error);
      toast({
        variant: "destructive",
        title: "Error updating finance record",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteFinance(id: string) {
    if (!confirm("Are you sure you want to delete this finance record? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("finances")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Finance record deleted successfully",
      });

      fetchFinances();
    } catch (error) {
      console.error("Error deleting finance record:", error);
      toast({
        variant: "destructive",
        title: "Error deleting finance record",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddFinance(e: React.FormEvent) {
    e.preventDefault();

    // If we're editing, call update instead
    if (editingFinance) {
      return handleUpdateFinance(e);
    }

    // Validate that client is selected
    if (!newFinance.client_id) {
      toast({
        variant: "destructive",
        title: "Please select a client",
        description: "A client must be selected to create a finance record.",
      });
      return;
    }

    setActionLoading(true);

    try {
      const { error } = await supabase.from("finances").insert({
        client_id: newFinance.client_id,
        amount: parseFloat(newFinance.amount),
        type: newFinance.type,
        due_date: newFinance.due_date || null,
        status: newFinance.status,
        created_by: null,
      });

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      toast({
        title: "Finance record added successfully",
      });

      setNewFinance({
        client_id: "",
        amount: "",
        type: "invoice",
        due_date: "",
        status: "pending",
      });
      fetchFinances();
    } catch (error) {
      console.error("Error adding finance record:", error);
      toast({
        variant: "destructive",
        title: "Error adding finance record",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  // Helper function to format currency
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  // Helper function to format dates
  function formatDate(dateString: string | null) {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold ml-4">Finance</h1>
        </div>
        <p className="text-muted-foreground mt-2">Track financial records and payments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Invoiced</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalInvoices)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-blue-100 dark:bg-blue-900">
              <DollarSign className="h-4 w-4 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalPayments)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {formatCurrency(totalExpenses)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-red-100 dark:bg-red-900">
              <Trash2 className="h-4 w-4 text-red-500" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Pending Invoices</p>
          <div className="flex items-center mt-1">
            <p className="text-2xl font-bold text-card-foreground">
              {formatCurrency(pendingInvoices)}
            </p>
            <div className="ml-2 p-1 rounded-full bg-amber-100 dark:bg-amber-900">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">{editingFinance ? "Edit Finance Record" : "Add New Record"}</h2>
        <form onSubmit={handleAddFinance} className="space-y-4">
          <div>
            <Label htmlFor="client">Client</Label>
            <Select
              value={newFinance.client_id}
              onValueChange={(value) => setNewFinance({ ...newFinance, client_id: value })}
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
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={newFinance.amount}
              onChange={(e) => setNewFinance({ ...newFinance, amount: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={newFinance.type}
              onValueChange={(value: "invoice" | "payment" | "expense") =>
                setNewFinance({ ...newFinance, type: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={newFinance.status}
              onValueChange={(value: "pending" | "paid" | "overdue") =>
                setNewFinance({ ...newFinance, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={newFinance.due_date}
              onChange={(e) => setNewFinance({ ...newFinance, due_date: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={actionLoading}>
              {actionLoading ? "Saving..." : editingFinance ? "Update Record" : "Add Record"}
            </Button>
            {editingFinance && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingFinance(null);
                  setNewFinance({
                    client_id: "",
                    amount: "",
                    type: "invoice",
                    due_date: "",
                    status: "pending",
                  });
                }}
              >
                Cancel Edit
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {finances.map((finance) => (
          <Card key={finance.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <DollarSign className={`mr-2 h-5 w-5 ${
                  finance.type === "payment" ? "text-green-500" :
                  finance.type === "expense" ? "text-red-500" :
                  "text-blue-500"
                }`} />
                <h3 className="text-xl font-semibold">{formatCurrency(finance.amount)}</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditFinance(finance)}
                  disabled={actionLoading}
                >
                  <Edit className="h-3 w-3 mr-1" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-800"
                  onClick={() => handleDeleteFinance(finance.id)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-3 w-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Client:</span>
                <span className="font-medium">{finance.clients?.name || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type:</span>
                <span className="capitalize">{finance.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  finance.status === "paid" ? "bg-green-100 text-green-800" :
                  finance.status === "overdue" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }`}>
                  {finance.status}
                </span>
              </div>
              {finance.due_date && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Due Date:</span>
                  <span>{formatDate(finance.due_date)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Created:</span>
                <span>{formatDate(finance.created_at)}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}