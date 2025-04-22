"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Edit, Trash2, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Client type to match our database schema
type Client = {
  id: string; // UUID is stored as string
  name: string;
  email?: string | null;
  status?: string;
  onboarding_document?: string | null;
  current_position?: string | null;
  created_at?: string;
  created_by?: string | null;
  notes?: string;
  channel_details?: string;
  project_ideas?: string;
};

export default function ClientsPage() {
  const [newClient, setNewClient] = useState({ name: "", email: "" });
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to fetch clients from Supabase
  async function fetchClients() {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setClients(data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast({
        variant: "destructive",
        title: "Error loading clients",
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // Function to add a new client
  async function handleAddClient(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("clients").insert({
        name: newClient.name,
        email: newClient.email,
        status: "active",
      });

      if (error) throw error;

      toast({
        title: "Client added successfully",
      });

      setNewClient({ name: "", email: "" });
      setIsAddDialogOpen(false); // Close the dialog
      fetchClients(); // Refresh the client list
    } catch (error) {
      console.error("Error adding client:", error);
      toast({
        variant: "destructive",
        title: "Error adding client",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Function to navigate to client edit page
  function handleEditClient(client: Client) {
    // We'll use the Link component for navigation instead of this function
    // This is kept for potential future use with additional logic
    console.log("Navigating to edit client:", client.id);
  }

  // Function to handle client deletion
  async function handleDeleteClient(id: string) {
    if (!confirm("Are you sure you want to delete this client? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Client deleted successfully",
      });

      // Refresh the client list
      fetchClients();
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Error deleting client",
        description: "Please try again later.",
      });
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage your client relationships</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
              <DialogDescription>
                Add a new client to your client list. Fill in the details below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddClient}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Client Name
                  </Label>
                  <Input
                    id="name"
                    value={newClient.name}
                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Client Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Client"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading clients...</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-8">No clients found. Add your first client above.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="overflow-hidden">
              <div className="bg-primary/5 p-4 border-b">
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-semibold">{client.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    client.status === "active" ? "bg-green-100 text-green-800" :
                    client.status === "inactive" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {client.status || "Unknown"}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm mt-1">{client.email || "No email provided"}</p>
              </div>

              <div className="p-4 space-y-4">
                {/* Client Goal Summary */}
                {client.client_goal && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Goal</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {client.client_goal}
                    </p>
                  </div>
                )}

                {/* Budget Summary */}
                {client.budget && typeof client.budget === 'object' && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Budget</h4>
                    <p className="text-sm font-semibold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: client.budget.currency || 'USD'
                      }).format(client.budget.total || 0)}
                    </p>
                  </div>
                )}

                {/* Hired People Summary */}
                {client.hired_people && Array.isArray(client.hired_people) && client.hired_people.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Team</h4>
                    <div className="flex flex-wrap gap-1">
                      {client.hired_people.slice(0, 3).map((person: any, index: number) => (
                        <span key={index} className="text-xs bg-muted px-2 py-1 rounded-full">
                          {person.name}
                        </span>
                      ))}
                      {client.hired_people.length > 3 && (
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          +{client.hired_people.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Timeline Summary */}
                {client.timeline && Array.isArray(client.timeline) && client.timeline.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Next Deadline</h4>
                    <p className="text-sm text-muted-foreground">
                      {client.timeline[0].date && new Date(client.timeline[0].date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}: {client.timeline[0].title}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t p-4 flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditClient(client)}
                  >
                    <Edit className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-800"
                    onClick={() => handleDeleteClient(client.id)}
                  >
                    <Trash2 className="h-3 w-3 mr-1" /> Delete
                  </Button>
                </div>
                <Link href={`/clients/${client.id}`}>
                  <Button variant="outline" size="sm">View Details</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

