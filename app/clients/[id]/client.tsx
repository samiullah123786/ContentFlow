"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import Link from "next/link";

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

export default function ClientDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client> | null>(null);

  useEffect(() => {
    if (id) {
      fetchClient(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchClient(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id) // Use the UUID string directly
        .single();

      if (error) throw error;

      setClient(data);
      setEditedClient(data); // Initialize the edited client data
    } catch (error) {
      console.error("Error fetching client:", error);
      toast({
        variant: "destructive",
        title: "Error loading client",
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!client || !editedClient) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update(editedClient)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Client updated successfully",
      });

      setClient({...client, ...editedClient});
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating client:", error);
      toast({
        variant: "destructive",
        title: "Error updating client",
        description: "Please try again later.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!client) return;

    setDeleting(true);

    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Client deleted successfully",
      });

      router.push("/clients");
    } catch (error) {
      console.error("Error deleting client:", error);
      toast({
        variant: "destructive",
        title: "Error deleting client",
        description: "Please try again later.",
      });
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-8">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
        </div>
        <div className="text-center">Loading client details...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
            <h1 className="text-3xl font-bold ml-4">Client Details</h1>
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
                  Edit Client
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

        <div className="text-center py-8">Client not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Button>
          </Link>
          <h1 className="text-3xl font-bold ml-4">Client Details</h1>
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
                Edit Client
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

      {client && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <Label htmlFor="name">Client Name</Label>
                    <Input
                      id="name"
                      value={editedClient?.name || ""}
                      onChange={(e) => setEditedClient({...editedClient!, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editedClient?.email || ""}
                      onChange={(e) => setEditedClient({...editedClient!, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={editedClient?.status || "active"}
                      onValueChange={(value: "active" | "inactive" | "archived") =>
                        setEditedClient({...editedClient!, status: value})
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <Label>Client Name</Label>
                    <p className="mt-1 font-semibold">{client.name}</p>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <p className="mt-1">{client.email || "No email provided"}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        client.status === "active" ? "bg-green-100 text-green-800" :
                        client.status === "inactive" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {client.status || "Unknown"}
                      </span>
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="notes">Client Notes</Label>
                {isEditing ? (
                  <Textarea
                    id="notes"
                    className="mt-2"
                    rows={4}
                    value={editedClient?.notes || ""}
                    onChange={(e) => setEditedClient({...editedClient!, notes: e.target.value})}
                    placeholder="Add notes about this client"
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{client.notes || "No notes available."}</p>
                )}
              </div>

              <div>
                <Label htmlFor="channel_details">Channel Details</Label>
                {isEditing ? (
                  <Textarea
                    id="channel_details"
                    className="mt-2"
                    rows={4}
                    value={editedClient?.channel_details || ""}
                    onChange={(e) => setEditedClient({...editedClient!, channel_details: e.target.value})}
                    placeholder="Add details about their channels, social media, etc."
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{client.channel_details || "No channel details available."}</p>
                )}
              </div>

              <div>
                <Label htmlFor="project_ideas">Project Ideas</Label>
                {isEditing ? (
                  <Textarea
                    id="project_ideas"
                    className="mt-2"
                    rows={4}
                    value={editedClient?.project_ideas || ""}
                    onChange={(e) => setEditedClient({...editedClient!, project_ideas: e.target.value})}
                    placeholder="Add project ideas for this client"
                  />
                ) : (
                  <p className="mt-1 whitespace-pre-wrap">{client.project_ideas || "No project ideas available."}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
