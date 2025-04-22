"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator, SelectLabel, SelectGroup } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, Trash2, Goal, Calendar, DollarSign, BarChart, Lightbulb, FileText, Video, Folder, FileVideo, UserCircle, ExternalLink, Edit } from "lucide-react";
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
  // New fields for client template
  client_goal?: string | null;
  onboarding_checklist?: any | null; // Using any for JSONB data
  budget?: any | null; // JSONB with total, currency, breakdown, notes
  timeline?: any | null; // JSONB array of timeline events
  tracking_results?: any | null; // JSONB array of tracking entries with metrics
  inspiration_list?: string | null;
  inspiration_notes?: string | null; // Added for structured inspiration data
  scripts_document?: string | null;
  scripts_notes?: string | null; // Added for structured scripts data
  hired_people?: any | null; // JSONB array of hired people (renamed from video_editor)
  video_folder?: any | null; // JSONB with path, links, notes
  video_description?: string | null;
  account_details?: string | null;
};

// Team member type
type TeamMember = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  skills?: string[] | null;
  hourly_rate?: number | null;
  status?: string | null;
};

export default function ClientDetailsClient({ id }: { id: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [client, setClient] = useState<Client | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editedClient, setEditedClient] = useState<Partial<Client> | null>(null);

  useEffect(() => {
    if (id) {
      fetchClient(id);
      fetchTeamMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTeamMembers() {
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("status", "active")
        .order("name", { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        variant: "destructive",
        title: "Error loading team members",
        description: "Please try again later.",
      });
    }
  }

  async function fetchClient(id: string) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id) // Use the UUID string directly
        .single();

      if (error) throw error;

      // Ensure onboarding_checklist is an array
      if (!data.onboarding_checklist || !Array.isArray(data.onboarding_checklist)) {
        data.onboarding_checklist = [
          { id: "1", title: "Initial client meeting", completed: false },
          { id: "2", title: "Collect brand assets", completed: false },
          { id: "3", title: "Define content strategy", completed: false },
          { id: "4", title: "Set up content calendar", completed: false },
          { id: "5", title: "Create client folder structure", completed: false },
          { id: "6", title: "Set up analytics tracking", completed: false },
          { id: "7", title: "Finalize contract", completed: false },
          { id: "8", title: "Collect payment details", completed: false },
          { id: "9", title: "Schedule kickoff call", completed: false },
          { id: "10", title: "Send welcome package", completed: false }
        ];
      }

      // Ensure budget has the correct structure
      if (!data.budget || typeof data.budget !== 'object') {
        data.budget = {
          total: 0,
          currency: 'USD',
          breakdown: [],
          notes: data.budget || ''
        };
      }

      // Ensure timeline has the correct structure
      if (!data.timeline || !Array.isArray(data.timeline)) {
        const today = new Date();
        data.timeline = [
          { id: '1', date: new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0], title: 'Project Start', description: 'Initial project kickoff' },
          { id: '2', date: new Date(today.setDate(today.getDate() + 7)).toISOString().split('T')[0], title: 'First Deliverable', description: 'First content piece due' },
          { id: '3', date: new Date(today.setDate(today.getDate() + 16)).toISOString().split('T')[0], title: 'Project Review', description: 'Review progress and adjust strategy' }
        ];
      }

      // Ensure tracking_results has the correct structure
      if (!data.tracking_results || !Array.isArray(data.tracking_results)) {
        data.tracking_results = [
          {
            id: '1',
            date: new Date().toISOString().split('T')[0],
            title: 'Initial Metrics',
            description: 'Baseline metrics before campaign start',
            metrics: {
              views: 0,
              engagement: 0,
              followers: 0,
              conversions: 0
            }
          }
        ];
      }

      // Ensure hired_people has the correct structure
      if (!data.hired_people || !Array.isArray(data.hired_people)) {
        data.hired_people = [];
      }

      // Ensure video_folder has the correct structure
      if (!data.video_folder || typeof data.video_folder !== 'object') {
        data.video_folder = {
          path: '',
          links: [],
          notes: data.video_folder || ''
        };
      }

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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label>Client Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={editedClient?.name || ""}
                      onChange={(e) => setEditedClient({...editedClient!, name: e.target.value})}
                      className="mt-1"
                      required
                    />
                  ) : (
                    <p className="mt-1 font-semibold">{client.name}</p>
                  )}
                </div>
                <div>
                  <Label>Email</Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={editedClient?.email || ""}
                      onChange={(e) => setEditedClient({...editedClient!, email: e.target.value})}
                      className="mt-1"
                    />
                  ) : (
                    <p className="mt-1">{client.email || "No email provided"}</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  {isEditing ? (
                    <Select
                      value={editedClient?.status || "active"}
                      onValueChange={(value: "active" | "inactive" | "archived") =>
                        setEditedClient({...editedClient!, status: value})
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="mt-1">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        client.status === "active" ? "bg-green-100 text-green-800" :
                        client.status === "inactive" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {client.status || "Unknown"}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="client-goal" className="w-full">
            <div className="border-b mb-4">
              <TabsList className="flex flex-wrap pb-2 -mb-px bg-transparent w-full justify-start">
              <TabsTrigger value="client-goal" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <Goal className="h-4 w-4 mb-1" />
                <span className="text-xs">Goal</span>
              </TabsTrigger>
              <TabsTrigger value="onboarding" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <FileText className="h-4 w-4 mb-1" />
                <span className="text-xs">Onboarding</span>
              </TabsTrigger>
              <TabsTrigger value="budget" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <DollarSign className="h-4 w-4 mb-1" />
                <span className="text-xs">Budget</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <Calendar className="h-4 w-4 mb-1" />
                <span className="text-xs">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <BarChart className="h-4 w-4 mb-1" />
                <span className="text-xs">Tracking</span>
              </TabsTrigger>
              <TabsTrigger value="inspiration" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <Lightbulb className="h-4 w-4 mb-1" />
                <span className="text-xs">Inspiration</span>
              </TabsTrigger>
              <TabsTrigger value="scripts" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <FileText className="h-4 w-4 mb-1" />
                <span className="text-xs">Scripts</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <Video className="h-4 w-4 mb-1" />
                <span className="text-xs">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="folder" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <Folder className="h-4 w-4 mb-1" />
                <span className="text-xs">Folder</span>
              </TabsTrigger>
              <TabsTrigger value="description" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <FileVideo className="h-4 w-4 mb-1" />
                <span className="text-xs">Description</span>
              </TabsTrigger>
              <TabsTrigger value="account" className="flex flex-col items-center py-2 h-auto min-w-[80px] flex-1">
                <UserCircle className="h-4 w-4 mb-1" />
                <span className="text-xs">Account</span>
              </TabsTrigger>
              </TabsList>
            </div>

            {/* Client Goal Tab */}
            <TabsContent value="client-goal" className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-4">
                  <CardTitle className="flex items-center">
                    <Goal className="h-5 w-5 mr-2 text-primary" />
                    Client Goal
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Define the client&apos;s primary goals and objectives</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 p-4 rounded-md border border-dashed">
                        <h3 className="text-sm font-medium mb-2">Tips for effective goals:</h3>
                        <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                          <li>Be specific and measurable</li>
                          <li>Include both short-term and long-term objectives</li>
                          <li>Consider growth metrics (followers, engagement, etc.)</li>
                          <li>Define what success looks like for this client</li>
                        </ul>
                      </div>
                      <Textarea
                        id="client_goal"
                        rows={6}
                        value={editedClient?.client_goal || ""}
                        onChange={(e) => setEditedClient({...editedClient!, client_goal: e.target.value})}
                        placeholder="Define the client&apos;s goals and objectives"
                        className="min-h-[150px]"
                      />
                    </div>
                  ) : (
                    <div>
                      {client.client_goal ? (
                        <div className="bg-card border rounded-md p-6 whitespace-pre-wrap relative">
                          <div className="absolute -top-3 -left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Goal</div>
                          <div className="prose prose-sm max-w-none">
                            {client.client_goal}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Goal className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-medium mb-1">No client goals defined yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">Define the client&apos;s goals to help guide your work</p>
                          {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                              <Edit className="h-4 w-4 mr-2" /> Add Goals
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onboarding Checklist Tab */}
            <TabsContent value="onboarding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Onboarding Checklist
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        {(editedClient?.onboarding_checklist || []).map((item: any, index: number) => (
                          <div key={item.id} className="flex items-start space-x-2">
                            <Checkbox
                              id={`checklist-${item.id}`}
                              checked={item.completed}
                              onCheckedChange={(checked) => {
                                const updatedChecklist = [...(editedClient?.onboarding_checklist || [])];
                                updatedChecklist[index].completed = checked;
                                setEditedClient({...editedClient!, onboarding_checklist: updatedChecklist});
                              }}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <Input
                                value={item.title}
                                onChange={(e) => {
                                  const updatedChecklist = [...(editedClient?.onboarding_checklist || [])];
                                  updatedChecklist[index].title = e.target.value;
                                  setEditedClient({...editedClient!, onboarding_checklist: updatedChecklist});
                                }}
                                className="h-8"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedChecklist = [...(editedClient?.onboarding_checklist || [])];
                                updatedChecklist.splice(index, 1);
                                setEditedClient({...editedClient!, onboarding_checklist: updatedChecklist});
                              }}
                              className="px-2 h-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const newItem = {
                              id: Date.now().toString(),
                              title: "",
                              completed: false
                            };
                            const updatedChecklist = [...(editedClient?.onboarding_checklist || []), newItem];
                            setEditedClient({...editedClient!, onboarding_checklist: updatedChecklist});
                          }}
                          className="mt-2"
                        >
                          Add Checklist Item
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {(client.onboarding_checklist || []).length > 0 ? (
                          (client.onboarding_checklist || []).map((item: any) => (
                            <div key={item.id} className="flex items-center space-x-2">
                              <Checkbox id={`checklist-${item.id}`} checked={item.completed} disabled />
                              <label
                                htmlFor={`checklist-${item.id}`}
                                className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                  item.completed ? 'line-through text-muted-foreground' : ''
                                }`}
                              >
                                {item.title}
                              </label>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground">No onboarding checklist items defined yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Budget Tab */}
            <TabsContent value="budget" className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 pb-4">
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
                    Budget
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Manage client budget and expenses</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget-total">Total Budget</Label>
                          <div className="flex">
                            <Input
                              id="budget-total"
                              type="number"
                              value={editedClient?.budget?.total || 0}
                              onChange={(e) => {
                                const updatedBudget = { ...(editedClient?.budget || {}) };
                                updatedBudget.total = parseFloat(e.target.value) || 0;
                                setEditedClient({...editedClient!, budget: updatedBudget});
                              }}
                              className="rounded-r-none"
                            />
                            <Select
                              value={editedClient?.budget?.currency || 'USD'}
                              onValueChange={(value) => {
                                const updatedBudget = { ...(editedClient?.budget || {}) };
                                updatedBudget.currency = value;
                                setEditedClient({...editedClient!, budget: updatedBudget});
                              }}
                            >
                              <SelectTrigger className="w-24 rounded-l-none">
                                <SelectValue placeholder="USD" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                                <SelectItem value="CAD">CAD</SelectItem>
                                <SelectItem value="AUD">AUD</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Budget Breakdown</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedBudget = { ...(editedClient?.budget || {}) };
                              if (!updatedBudget.breakdown) updatedBudget.breakdown = [];
                              updatedBudget.breakdown.push({
                                id: Date.now().toString(),
                                category: '',
                                amount: 0,
                                notes: ''
                              });
                              setEditedClient({...editedClient!, budget: updatedBudget});
                            }}
                          >
                            Add Item
                          </Button>
                        </div>

                        {(editedClient?.budget?.breakdown || []).length > 0 ? (
                          <div className="space-y-4">
                            {(editedClient?.budget?.breakdown || []).map((item: any, index: number) => (
                              <div key={item.id} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md">
                                <div className="col-span-4">
                                  <Label htmlFor={`item-category-${item.id}`} className="text-xs">Category</Label>
                                  <Input
                                    id={`item-category-${item.id}`}
                                    value={item.category || ''}
                                    onChange={(e) => {
                                      const updatedBudget = { ...(editedClient?.budget || {}) };
                                      updatedBudget.breakdown[index].category = e.target.value;
                                      setEditedClient({...editedClient!, budget: updatedBudget});
                                    }}
                                  />
                                </div>
                                <div className="col-span-3">
                                  <Label htmlFor={`item-amount-${item.id}`} className="text-xs">Amount</Label>
                                  <Input
                                    id={`item-amount-${item.id}`}
                                    type="number"
                                    value={item.amount || 0}
                                    onChange={(e) => {
                                      const updatedBudget = { ...(editedClient?.budget || {}) };
                                      updatedBudget.breakdown[index].amount = parseFloat(e.target.value) || 0;
                                      setEditedClient({...editedClient!, budget: updatedBudget});
                                    }}
                                  />
                                </div>
                                <div className="col-span-4">
                                  <Label htmlFor={`item-notes-${item.id}`} className="text-xs">Notes</Label>
                                  <Input
                                    id={`item-notes-${item.id}`}
                                    value={item.notes || ''}
                                    onChange={(e) => {
                                      const updatedBudget = { ...(editedClient?.budget || {}) };
                                      updatedBudget.breakdown[index].notes = e.target.value;
                                      setEditedClient({...editedClient!, budget: updatedBudget});
                                    }}
                                  />
                                </div>
                                <div className="col-span-1 pt-5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const updatedBudget = { ...(editedClient?.budget || {}) };
                                      updatedBudget.breakdown.splice(index, 1);
                                      setEditedClient({...editedClient!, budget: updatedBudget});
                                    }}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Budget Summary */}
                            <div className="bg-muted/30 p-4 rounded-md border mt-4">
                              <div className="flex justify-between items-center mb-2">
                                <h4 className="font-medium">Budget Summary</h4>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Total Budget:</span>
                                  <span className="font-medium">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: editedClient?.budget?.currency || 'USD'
                                    }).format(editedClient?.budget?.total || 0)}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Total Expenses:</span>
                                  <span className="font-medium">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: editedClient?.budget?.currency || 'USD'
                                    }).format((editedClient?.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0))}
                                  </span>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                  <div className="flex justify-between font-medium">
                                    <span>Remaining Budget:</span>
                                    <span className={`${(editedClient?.budget?.total || 0) - (editedClient?.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: editedClient?.budget?.currency || 'USD'
                                      }).format((editedClient?.budget?.total || 0) - (editedClient?.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0))}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No budget items added yet.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="budget-notes">Additional Notes</Label>
                        <Textarea
                          id="budget-notes"
                          value={editedClient?.budget?.notes || ''}
                          onChange={(e) => {
                            const updatedBudget = { ...(editedClient?.budget || {}) };
                            updatedBudget.notes = e.target.value;
                            setEditedClient({...editedClient!, budget: updatedBudget});
                          }}
                          placeholder="Additional budget notes or details"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Budget</h3>
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: client.budget?.currency || 'USD'
                            }).format(client.budget?.total || 0)}
                          </p>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</h3>
                          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: client.budget?.currency || 'USD'
                            }).format((client.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0))}
                          </p>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">Remaining Budget</h3>
                          <p className={`text-3xl font-bold ${(client.budget?.total || 0) - (client.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                            {new Intl.NumberFormat('en-US', {
                              style: 'currency',
                              currency: client.budget?.currency || 'USD'
                            }).format((client.budget?.total || 0) - (client.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0))}
                          </p>
                        </div>
                      </div>

                      {(client.budget?.breakdown || []).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Budget Breakdown</h3>
                          <div className="border rounded-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="text-left p-2">Category</th>
                                  <th className="text-right p-2">Amount</th>
                                  <th className="text-left p-2">Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(client.budget?.breakdown || []).map((item: any) => (
                                  <tr key={item.id} className="border-t">
                                    <td className="p-2">{item.category || 'Uncategorized'}</td>
                                    <td className="p-2 text-right">
                                      {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: client.budget?.currency || 'USD'
                                      }).format(item.amount || 0)}
                                    </td>
                                    <td className="p-2">{item.notes || '-'}</td>
                                  </tr>
                                ))}
                                <tr className="border-t bg-muted/50">
                                  <td className="p-2 font-medium">Total Expenses</td>
                                  <td className="p-2 text-right font-medium">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: client.budget?.currency || 'USD'
                                    }).format((client.budget?.breakdown || []).reduce((sum: number, item: any) => sum + (parseFloat(item.amount) || 0), 0))}
                                  </td>
                                  <td className="p-2"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {client.budget?.notes && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Additional Notes</h3>
                          <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md border">
                            {client.budget.notes}
                          </div>
                        </div>
                      )}

                      {!client.budget?.total && !client.budget?.breakdown?.length && !client.budget?.notes && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <DollarSign className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-medium mb-1">No budget information defined yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">Define the client&apos;s budget to track expenses</p>
                          {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                              <Edit className="h-4 w-4 mr-2" /> Add Budget
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Timeline Tab */}
            <TabsContent value="timeline" className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 pb-4">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
                    Timeline
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Track important dates and milestones</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Timeline Events</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedTimeline = [...(editedClient?.timeline || [])];
                              updatedTimeline.push({
                                id: Date.now().toString(),
                                title: '',
                                date: new Date().toISOString().split('T')[0],
                                end_date: '',
                                description: '',
                                status: 'upcoming'
                              });
                              setEditedClient({...editedClient!, timeline: updatedTimeline});
                            }}
                          >
                            Add Event
                          </Button>
                        </div>

                        {(editedClient?.timeline || []).length > 0 ? (
                          <div className="space-y-4">
                            {(editedClient?.timeline || [])
                              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((event: any) => (
                              <div key={event.id} className="border p-4 rounded-md space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`event-title-${event.id}`}>Title</Label>
                                    <Input
                                      id={`event-title-${event.id}`}
                                      value={event.title || ''}
                                      onChange={(e) => {
                                        const updatedTimeline = [...(editedClient?.timeline || [])];
                                        const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                        if (eventIndex !== -1) {
                                          updatedTimeline[eventIndex].title = e.target.value;
                                          setEditedClient({...editedClient!, timeline: updatedTimeline});
                                        }
                                      }}
                                      placeholder="Event title"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`event-status-${event.id}`}>Status</Label>
                                    <Select
                                      value={event.status || 'upcoming'}
                                      onValueChange={(value) => {
                                        const updatedTimeline = [...(editedClient?.timeline || [])];
                                        const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                        if (eventIndex !== -1) {
                                          updatedTimeline[eventIndex].status = value;
                                          setEditedClient({...editedClient!, timeline: updatedTimeline});
                                        }
                                      }}
                                    >
                                      <SelectTrigger id={`event-status-${event.id}`}>
                                        <SelectValue placeholder="Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="upcoming">Upcoming</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="delayed">Delayed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor={`event-date-${event.id}`}>Start Date</Label>
                                    <Input
                                      id={`event-date-${event.id}`}
                                      type="date"
                                      value={event.date || ''}
                                      onChange={(e) => {
                                        const updatedTimeline = [...(editedClient?.timeline || [])];
                                        const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                        if (eventIndex !== -1) {
                                          updatedTimeline[eventIndex].date = e.target.value;
                                          setEditedClient({...editedClient!, timeline: updatedTimeline});
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between">
                                      <Label htmlFor={`event-end-date-${event.id}`}>End Date (Optional)</Label>
                                    </div>
                                    <Input
                                      id={`event-end-date-${event.id}`}
                                      type="date"
                                      value={event.end_date || ''}
                                      onChange={(e) => {
                                        const updatedTimeline = [...(editedClient?.timeline || [])];
                                        const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                        if (eventIndex !== -1) {
                                          updatedTimeline[eventIndex].end_date = e.target.value;
                                          setEditedClient({...editedClient!, timeline: updatedTimeline});
                                        }
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`event-description-${event.id}`}>Description</Label>
                                  <Textarea
                                    id={`event-description-${event.id}`}
                                    value={event.description || ''}
                                    onChange={(e) => {
                                      const updatedTimeline = [...(editedClient?.timeline || [])];
                                      const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                      if (eventIndex !== -1) {
                                        updatedTimeline[eventIndex].description = e.target.value;
                                        setEditedClient({...editedClient!, timeline: updatedTimeline});
                                      }
                                    }}
                                    placeholder="Event details"
                                    className="min-h-[80px]"
                                  />
                                </div>

                                <div className="flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const updatedTimeline = [...(editedClient?.timeline || [])];
                                      const eventIndex = updatedTimeline.findIndex(item => item.id === event.id);
                                      if (eventIndex !== -1) {
                                        updatedTimeline.splice(eventIndex, 1);
                                        setEditedClient({...editedClient!, timeline: updatedTimeline});
                                      }
                                    }}
                                    className="text-red-500"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" /> Remove
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 border border-dashed rounded-md">
                            <Calendar className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                            <p className="text-sm text-muted-foreground">No timeline events added yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(client.timeline || []).length > 0 ? (
                        <div>
                          {/* Timeline summary */}
                          <div className="mb-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {(() => {
                                const now = new Date();
                                const upcomingEvents = (client.timeline || [])
                                  .filter((event: any) => new Date(event.date) > now)
                                  .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

                                const nextEvent = upcomingEvents[0];
                                const totalEvents = (client.timeline || []).length;
                                const completedEvents = (client.timeline || []).filter((event: any) => event.status === 'completed').length;

                                return (
                                  <>
                                    <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Next Deadline</h3>
                                      {nextEvent ? (
                                        <>
                                          <p className="text-xl font-bold">{nextEvent.title}</p>
                                          <p className="text-sm mt-1">
                                            {new Date(nextEvent.date).toLocaleDateString('en-US', {
                                              month: 'short',
                                              day: 'numeric',
                                              year: 'numeric'
                                            })}
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-muted-foreground">No upcoming events</p>
                                      )}
                                    </div>

                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg">
                                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Progress</h3>
                                      <p className="text-3xl font-bold">
                                        {totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0}%
                                      </p>
                                      <p className="text-sm mt-1">{completedEvents} of {totalEvents} completed</p>
                                    </div>

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Timeline</h3>
                                      <p className="text-xl font-bold">{totalEvents} Events</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-block w-3 h-3 rounded-full bg-green-500"></span>
                                        <span className="text-xs">{completedEvents} Completed</span>

                                        <span className="inline-block w-3 h-3 rounded-full bg-yellow-500 ml-2"></span>
                                        <span className="text-xs">
                                          {(client.timeline || []).filter((event: any) => event.status === 'in-progress').length} In Progress
                                        </span>
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          {/* Timeline visualization */}
                          <div className="relative pl-6 border-l-2 border-muted space-y-8">
                            {(client.timeline || [])
                              .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                              .map((event: any) => {
                                const eventDate = new Date(event.date);
                                const eventEndDate = event.end_date ? new Date(event.end_date) : null;
                                const now = new Date();
                                // We'll use these variables later if needed
                                // const isUpcoming = eventDate > now;
                                // const isPast = eventDate < now;
                                const isToday = now.toDateString() === eventDate.toDateString();

                                let statusColor = 'bg-blue-500';
                                if (event.status === 'completed') statusColor = 'bg-green-500';
                                if (event.status === 'delayed') statusColor = 'bg-red-500';
                                if (event.status === 'in-progress') statusColor = 'bg-yellow-500';

                                return (
                                  <div key={event.id} className="relative">
                                    <div className={`absolute -left-[25px] top-0 h-4 w-4 rounded-full ${statusColor} border-4 border-background`}></div>
                                    <div className="space-y-1">
                                      <div className="flex items-center flex-wrap gap-2">
                                        <h3 className="text-lg font-semibold">{event.title}</h3>
                                        {isToday && <span className="text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">Today</span>}
                                        {event.status && (
                                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            event.status === 'upcoming' ? 'bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300' :
                                            event.status === 'in-progress' ? 'bg-yellow-100 dark:bg-yellow-800/30 text-yellow-800 dark:text-yellow-300' :
                                            event.status === 'completed' ? 'bg-green-100 dark:bg-green-800/30 text-green-800 dark:text-green-300' :
                                            'bg-red-100 dark:bg-red-800/30 text-red-800 dark:text-red-300'
                                          }`}>
                                            {event.status === 'upcoming' ? 'Upcoming' :
                                             event.status === 'in-progress' ? 'In Progress' :
                                             event.status === 'completed' ? 'Completed' :
                                             'Delayed'}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        {eventDate.toLocaleDateString('en-US', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                        {eventEndDate && (
                                          <> - {eventEndDate.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}</>
                                        )}
                                      </p>
                                      {event.description && (
                                        <p className="text-sm mt-2 bg-muted/30 p-3 rounded-md">{event.description}</p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                          <h3 className="text-lg font-medium mb-1">No timeline events yet</h3>
                          <p className="text-sm text-muted-foreground mb-4">Add important dates and milestones</p>
                          {!isEditing && (
                            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                              <Edit className="h-4 w-4 mr-2" /> Add Timeline Events
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tracking Results Tab */}
            <TabsContent value="tracking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2" />
                    Tracking Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-6">
                      {(editedClient?.tracking_results || []).map((entry: any, index: number) => (
                        <div key={entry.id} className="border rounded-md p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Tracking Entry</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updatedResults = [...(editedClient?.tracking_results || [])];
                                updatedResults.splice(index, 1);
                                setEditedClient({...editedClient!, tracking_results: updatedResults});
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`entry-date-${entry.id}`}>Date</Label>
                              <Input
                                id={`entry-date-${entry.id}`}
                                type="date"
                                value={entry.date}
                                onChange={(e) => {
                                  const updatedResults = [...(editedClient?.tracking_results || [])];
                                  updatedResults[index].date = e.target.value;
                                  setEditedClient({...editedClient!, tracking_results: updatedResults});
                                }}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`entry-title-${entry.id}`}>Title</Label>
                              <Input
                                id={`entry-title-${entry.id}`}
                                value={entry.title || ''}
                                onChange={(e) => {
                                  const updatedResults = [...(editedClient?.tracking_results || [])];
                                  updatedResults[index].title = e.target.value;
                                  setEditedClient({...editedClient!, tracking_results: updatedResults});
                                }}
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`entry-desc-${entry.id}`}>Description</Label>
                            <Textarea
                              id={`entry-desc-${entry.id}`}
                              value={entry.description || ''}
                              onChange={(e) => {
                                const updatedResults = [...(editedClient?.tracking_results || [])];
                                updatedResults[index].description = e.target.value;
                                setEditedClient({...editedClient!, tracking_results: updatedResults});
                              }}
                            />
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium">Metrics</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`metric-views-${entry.id}`}>Views</Label>
                                <Input
                                  id={`metric-views-${entry.id}`}
                                  type="number"
                                  value={entry.metrics?.views || 0}
                                  onChange={(e) => {
                                    const updatedResults = [...(editedClient?.tracking_results || [])];
                                    if (!updatedResults[index].metrics) updatedResults[index].metrics = {};
                                    updatedResults[index].metrics.views = parseInt(e.target.value) || 0;
                                    setEditedClient({...editedClient!, tracking_results: updatedResults});
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`metric-engagement-${entry.id}`}>Engagement</Label>
                                <Input
                                  id={`metric-engagement-${entry.id}`}
                                  type="number"
                                  value={entry.metrics?.engagement || 0}
                                  onChange={(e) => {
                                    const updatedResults = [...(editedClient?.tracking_results || [])];
                                    if (!updatedResults[index].metrics) updatedResults[index].metrics = {};
                                    updatedResults[index].metrics.engagement = parseInt(e.target.value) || 0;
                                    setEditedClient({...editedClient!, tracking_results: updatedResults});
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`metric-followers-${entry.id}`}>Followers</Label>
                                <Input
                                  id={`metric-followers-${entry.id}`}
                                  type="number"
                                  value={entry.metrics?.followers || 0}
                                  onChange={(e) => {
                                    const updatedResults = [...(editedClient?.tracking_results || [])];
                                    if (!updatedResults[index].metrics) updatedResults[index].metrics = {};
                                    updatedResults[index].metrics.followers = parseInt(e.target.value) || 0;
                                    setEditedClient({...editedClient!, tracking_results: updatedResults});
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`metric-conversions-${entry.id}`}>Conversions</Label>
                                <Input
                                  id={`metric-conversions-${entry.id}`}
                                  type="number"
                                  value={entry.metrics?.conversions || 0}
                                  onChange={(e) => {
                                    const updatedResults = [...(editedClient?.tracking_results || [])];
                                    if (!updatedResults[index].metrics) updatedResults[index].metrics = {};
                                    updatedResults[index].metrics.conversions = parseInt(e.target.value) || 0;
                                    setEditedClient({...editedClient!, tracking_results: updatedResults});
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newEntry = {
                            id: Date.now().toString(),
                            date: new Date().toISOString().split('T')[0],
                            title: 'New Tracking Entry',
                            description: '',
                            metrics: {
                              views: 0,
                              engagement: 0,
                              followers: 0,
                              conversions: 0
                            }
                          };
                          const updatedResults = [...(editedClient?.tracking_results || []), newEntry];
                          setEditedClient({...editedClient!, tracking_results: updatedResults});
                        }}
                      >
                        Add Tracking Entry
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {(client.tracking_results || []).length > 0 ? (
                        (client.tracking_results || []).map((entry: any) => (
                          <div key={entry.id} className="border rounded-md p-4 space-y-4">
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="text-lg font-semibold">{entry.title || 'Tracking Entry'}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(entry.date).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                            </div>

                            {entry.description && (
                              <div className="text-sm">{entry.description}</div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="bg-primary/10 p-4 rounded-md">
                                <div className="text-sm text-muted-foreground">Views</div>
                                <div className="text-2xl font-bold">{entry.metrics?.views?.toLocaleString() || 0}</div>
                              </div>
                              <div className="bg-primary/10 p-4 rounded-md">
                                <div className="text-sm text-muted-foreground">Engagement</div>
                                <div className="text-2xl font-bold">{entry.metrics?.engagement?.toLocaleString() || 0}</div>
                              </div>
                              <div className="bg-primary/10 p-4 rounded-md">
                                <div className="text-sm text-muted-foreground">Followers</div>
                                <div className="text-2xl font-bold">{entry.metrics?.followers?.toLocaleString() || 0}</div>
                              </div>
                              <div className="bg-primary/10 p-4 rounded-md">
                                <div className="text-sm text-muted-foreground">Conversions</div>
                                <div className="text-2xl font-bold">{entry.metrics?.conversions?.toLocaleString() || 0}</div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground">No tracking results defined yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inspiration List Tab */}
            <TabsContent value="inspiration" className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-800/20 pb-4">
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2 text-amber-500" />
                    Client Inspiration List
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Collect inspiration sources and references for the client</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Inspiration Links</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Convert text-based inspiration list to structured format if needed
                              let currentInspirationList = editedClient?.inspiration_list || "";
                              let updatedInspirationList;

                              try {
                                // Try to parse as JSON if it's already in structured format
                                updatedInspirationList = JSON.parse(currentInspirationList);
                              } catch (e) {
                                // If not JSON, initialize as empty array
                                updatedInspirationList = [];
                              }

                              if (!Array.isArray(updatedInspirationList)) {
                                updatedInspirationList = [];
                              }

                              // Add new inspiration item
                              updatedInspirationList.push({
                                id: Date.now().toString(),
                                title: '',
                                url: '',
                                notes: ''
                              });

                              setEditedClient({...editedClient!, inspiration_list: JSON.stringify(updatedInspirationList)});
                            }}
                          >
                            Add Inspiration
                          </Button>
                        </div>

                        {(() => {
                          let inspirationItems = [];
                          try {
                            const parsed = JSON.parse(editedClient?.inspiration_list || "[]");
                            if (Array.isArray(parsed)) {
                              inspirationItems = parsed;
                            }
                          } catch (e) {
                            // If parsing fails, keep empty array
                          }

                          return inspirationItems.length > 0 ? (
                            <div className="space-y-4">
                              {inspirationItems.map((item: any, index: number) => (
                                <div key={item.id} className="border p-4 rounded-md space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`inspiration-title-${item.id}`}>Title</Label>
                                      <Input
                                        id={`inspiration-title-${item.id}`}
                                        value={item.title || ''}
                                        onChange={(e) => {
                                          const updatedItems = [...inspirationItems];
                                          updatedItems[index].title = e.target.value;
                                          setEditedClient({...editedClient!, inspiration_list: JSON.stringify(updatedItems)});
                                        }}
                                        placeholder="Inspiration title"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`inspiration-url-${item.id}`}>URL</Label>
                                      <Input
                                        id={`inspiration-url-${item.id}`}
                                        value={item.url || ''}
                                        onChange={(e) => {
                                          const updatedItems = [...inspirationItems];
                                          updatedItems[index].url = e.target.value;
                                          setEditedClient({...editedClient!, inspiration_list: JSON.stringify(updatedItems)});
                                        }}
                                        placeholder="https://example.com"
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`inspiration-notes-${item.id}`}>Notes</Label>
                                    <Textarea
                                      id={`inspiration-notes-${item.id}`}
                                      value={item.notes || ''}
                                      onChange={(e) => {
                                        const updatedItems = [...inspirationItems];
                                        updatedItems[index].notes = e.target.value;
                                        setEditedClient({...editedClient!, inspiration_list: JSON.stringify(updatedItems)});
                                      }}
                                      placeholder="Why is this inspiring?"
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedItems = [...inspirationItems];
                                        updatedItems.splice(index, 1);
                                        setEditedClient({...editedClient!, inspiration_list: JSON.stringify(updatedItems)});
                                      }}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed rounded-md">
                              <Lightbulb className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                              <p className="text-sm text-muted-foreground">No inspiration items added yet</p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="inspiration-text">Additional Notes</Label>
                        <Textarea
                          id="inspiration-text"
                          rows={4}
                          value={(() => {
                            try {
                              // If it's JSON, we've converted to structured format
                              JSON.parse(editedClient?.inspiration_list || "");
                              return editedClient?.inspiration_notes || "";
                            } catch (e) {
                              // If not JSON, it's the old text format
                              return editedClient?.inspiration_list || "";
                            }
                          })()}
                          onChange={(e) => setEditedClient({...editedClient!, inspiration_notes: e.target.value})}
                          placeholder="Additional inspiration notes"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        let inspirationItems = [];
                        let hasTextContent = false;

                        try {
                          const parsed = JSON.parse(client.inspiration_list || "[]");
                          if (Array.isArray(parsed)) {
                            inspirationItems = parsed;
                          }
                        } catch (e) {
                          // If parsing fails, it's the old text format
                          hasTextContent = !!client.inspiration_list;
                        }

                        return (
                          <>
                            {inspirationItems.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Inspiration Sources</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {inspirationItems.map((item: any) => (
                                    <div key={item.id} className="border rounded-md overflow-hidden">
                                      <div className="bg-amber-50 dark:bg-amber-900/20 p-3 border-b">
                                        <h4 className="font-medium">{item.title || 'Untitled Inspiration'}</h4>
                                      </div>
                                      <div className="p-4 space-y-3">
                                        {item.url && (
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-primary hover:underline text-sm"
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            {item.url}
                                          </a>
                                        )}
                                        {item.notes && (
                                          <div className="text-sm text-muted-foreground">
                                            {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {hasTextContent && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Notes</h3>
                                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md border">
                                  {client.inspiration_list}
                                </div>
                              </div>
                            )}

                            {client.inspiration_notes && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Additional Notes</h3>
                                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md border">
                                  {client.inspiration_notes}
                                </div>
                              </div>
                            )}

                            {!inspirationItems.length && !hasTextContent && !client.inspiration_notes && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <Lightbulb className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium mb-1">No inspiration sources yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">Add inspiration sources to guide content creation</p>
                                {!isEditing && (
                                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" /> Add Inspiration
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scripts Document Tab */}
            <TabsContent value="scripts" className="space-y-4">
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 pb-4">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                    Client Scripts Document
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Manage scripts and content documents for the client</p>
                </CardHeader>
                <CardContent className="pt-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Script Documents</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Convert text-based scripts to structured format if needed
                              let currentScripts = editedClient?.scripts_document || "";
                              let updatedScripts;

                              try {
                                // Try to parse as JSON if it's already in structured format
                                updatedScripts = JSON.parse(currentScripts);
                              } catch (e) {
                                // If not JSON, initialize as empty array
                                updatedScripts = [];
                              }

                              if (!Array.isArray(updatedScripts)) {
                                updatedScripts = [];
                              }

                              // Add new script item
                              updatedScripts.push({
                                id: Date.now().toString(),
                                title: '',
                                url: '',
                                type: 'video',
                                count: 1,
                                notes: ''
                              });

                              setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedScripts)});
                            }}
                          >
                            Add Script Document
                          </Button>
                        </div>

                        {(() => {
                          let scriptItems = [];
                          try {
                            const parsed = JSON.parse(editedClient?.scripts_document || "[]");
                            if (Array.isArray(parsed)) {
                              scriptItems = parsed;
                            }
                          } catch (e) {
                            // If parsing fails, keep empty array
                          }

                          return scriptItems.length > 0 ? (
                            <div className="space-y-4">
                              {scriptItems.map((item: any, index: number) => (
                                <div key={item.id} className="border p-4 rounded-md space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor={`script-title-${item.id}`}>Title</Label>
                                      <Input
                                        id={`script-title-${item.id}`}
                                        value={item.title || ''}
                                        onChange={(e) => {
                                          const updatedItems = [...scriptItems];
                                          updatedItems[index].title = e.target.value;
                                          setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                        }}
                                        placeholder="Script document title"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`script-type-${item.id}`}>Type</Label>
                                      <Select
                                        value={item.type || 'video'}
                                        onValueChange={(value) => {
                                          const updatedItems = [...scriptItems];
                                          updatedItems[index].type = value;
                                          setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                        }}
                                      >
                                        <SelectTrigger id={`script-type-${item.id}`}>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="video">Video Script</SelectItem>
                                          <SelectItem value="social">Social Media</SelectItem>
                                          <SelectItem value="blog">Blog Post</SelectItem>
                                          <SelectItem value="email">Email</SelectItem>
                                          <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor={`script-count-${item.id}`}>Count</Label>
                                      <Input
                                        id={`script-count-${item.id}`}
                                        type="number"
                                        min="1"
                                        value={item.count || 1}
                                        onChange={(e) => {
                                          const updatedItems = [...scriptItems];
                                          updatedItems[index].count = parseInt(e.target.value) || 1;
                                          setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`script-url-${item.id}`}>URL</Label>
                                    <Input
                                      id={`script-url-${item.id}`}
                                      value={item.url || ''}
                                      onChange={(e) => {
                                        const updatedItems = [...scriptItems];
                                        updatedItems[index].url = e.target.value;
                                        setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                      }}
                                      placeholder="https://docs.google.com/document/..."
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor={`script-notes-${item.id}`}>Notes</Label>
                                    <Textarea
                                      id={`script-notes-${item.id}`}
                                      value={item.notes || ''}
                                      onChange={(e) => {
                                        const updatedItems = [...scriptItems];
                                        updatedItems[index].notes = e.target.value;
                                        setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                      }}
                                      placeholder="Additional notes about this script"
                                    />
                                  </div>
                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatedItems = [...scriptItems];
                                        updatedItems.splice(index, 1);
                                        setEditedClient({...editedClient!, scripts_document: JSON.stringify(updatedItems)});
                                      }}
                                      className="text-red-500"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" /> Remove
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 border border-dashed rounded-md">
                              <FileText className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                              <p className="text-sm text-muted-foreground">No script documents added yet</p>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="scripts-text">Additional Notes</Label>
                        <Textarea
                          id="scripts-text"
                          rows={4}
                          value={(() => {
                            try {
                              // If it's JSON, we've converted to structured format
                              JSON.parse(editedClient?.scripts_document || "");
                              return editedClient?.scripts_notes || "";
                            } catch (e) {
                              // If not JSON, it's the old text format
                              return editedClient?.scripts_document || "";
                            }
                          })()}
                          onChange={(e) => setEditedClient({...editedClient!, scripts_notes: e.target.value})}
                          placeholder="Additional script notes"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(() => {
                        let scriptItems = [];
                        let hasTextContent = false;

                        try {
                          const parsed = JSON.parse(client.scripts_document || "[]");
                          if (Array.isArray(parsed)) {
                            scriptItems = parsed;
                          }
                        } catch (e) {
                          // If parsing fails, it's the old text format
                          hasTextContent = !!client.scripts_document;
                        }

                        return (
                          <>
                            {scriptItems.length > 0 && (
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Script Documents</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {scriptItems.map((item: any) => (
                                    <div key={item.id} className="border rounded-md overflow-hidden">
                                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 border-b flex justify-between items-center">
                                        <div>
                                          <h4 className="font-medium">{item.title || 'Untitled Script'}</h4>
                                          <div className="flex items-center mt-1">
                                            <span className="text-xs bg-blue-100 dark:bg-blue-800/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full">
                                              {item.type === 'video' ? 'Video Script' :
                                               item.type === 'social' ? 'Social Media' :
                                               item.type === 'blog' ? 'Blog Post' :
                                               item.type === 'email' ? 'Email' : 'Other'}
                                            </span>
                                            {item.count > 1 && (
                                              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-full ml-2">
                                                {item.count} items
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="p-4 space-y-3">
                                        {item.url && (
                                          <a
                                            href={item.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center text-primary hover:underline text-sm"
                                          >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Open Document
                                          </a>
                                        )}
                                        {item.notes && (
                                          <div className="text-sm text-muted-foreground">
                                            {item.notes}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {hasTextContent && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Notes</h3>
                                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md border">
                                  {client.scripts_document}
                                </div>
                              </div>
                            )}

                            {client.scripts_notes && (
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">Additional Notes</h3>
                                <div className="whitespace-pre-wrap text-sm bg-muted/30 p-4 rounded-md border">
                                  {client.scripts_notes}
                                </div>
                              </div>
                            )}

                            {!scriptItems.length && !hasTextContent && !client.scripts_notes && (
                              <div className="flex flex-col items-center justify-center py-8 text-center">
                                <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-medium mb-1">No script documents yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">Add script documents to organize content</p>
                                {!isEditing && (
                                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                                    <Edit className="h-4 w-4 mr-2" /> Add Scripts
                                  </Button>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hired People Tab */}
            <TabsContent value="editor" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Hired People
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-6">
                      {(editedClient?.hired_people || []).map((person: any, index: number) => (
                        <div key={person.id || index} className="border rounded-md p-4 space-y-4">
                          <div className="flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Team Member</h3>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const updatedPeople = [...(editedClient?.hired_people || [])];
                                updatedPeople.splice(index, 1);
                                setEditedClient({...editedClient!, hired_people: updatedPeople});
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Person</Label>
                              <Select
                                value={person.team_member_id || ''}
                                onValueChange={(value) => {
                                  const updatedPeople = [...(editedClient?.hired_people || [])];

                                  if (value === 'external') {
                                    // External person selected
                                    updatedPeople[index] = {
                                      ...updatedPeople[index],
                                      team_member_id: null,
                                      external: true,
                                      name: updatedPeople[index].name || '',
                                      role: updatedPeople[index].role || ''
                                    };
                                  } else {
                                    // Team member selected
                                    const teamMember = teamMembers.find(tm => tm.id === value);
                                    if (teamMember) {
                                      updatedPeople[index] = {
                                        ...updatedPeople[index],
                                        team_member_id: value,
                                        external: false,
                                        name: teamMember.name,
                                        role: teamMember.role || ''
                                      };
                                    }
                                  }

                                  setEditedClient({...editedClient!, hired_people: updatedPeople});
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a person" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="external">External Person</SelectItem>
                                  <SelectSeparator />
                                  <SelectGroup>
                                    <SelectLabel>Team Members</SelectLabel>
                                    {teamMembers.map((member) => (
                                      <SelectItem key={member.id} value={member.id}>
                                        {member.name} - {member.role}
                                      </SelectItem>
                                    ))}
                                  </SelectGroup>
                                </SelectContent>
                              </Select>
                            </div>

                            {(!person.team_member_id || person.external) && (
                              <div className="space-y-2">
                                <Label htmlFor={`person-name-${index}`}>Name</Label>
                                <Input
                                  id={`person-name-${index}`}
                                  value={person.name || ''}
                                  onChange={(e) => {
                                    const updatedPeople = [...(editedClient?.hired_people || [])];
                                    updatedPeople[index].name = e.target.value;
                                    setEditedClient({...editedClient!, hired_people: updatedPeople});
                                  }}
                                  placeholder="External person's name"
                                />
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor={`person-role-${index}`}>Role</Label>
                              <Input
                                id={`person-role-${index}`}
                                value={person.role || ''}
                                onChange={(e) => {
                                  const updatedPeople = [...(editedClient?.hired_people || [])];
                                  updatedPeople[index].role = e.target.value;
                                  setEditedClient({...editedClient!, hired_people: updatedPeople});
                                }}
                                placeholder="Role or responsibility"
                                disabled={!!person.team_member_id && !person.external}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`person-rate-${index}`}>Rate (per hour)</Label>
                              <Input
                                id={`person-rate-${index}`}
                                type="number"
                                value={person.rate || ''}
                                onChange={(e) => {
                                  const updatedPeople = [...(editedClient?.hired_people || [])];
                                  updatedPeople[index].rate = parseFloat(e.target.value) || 0;
                                  setEditedClient({...editedClient!, hired_people: updatedPeople});
                                }}
                                placeholder="Hourly rate"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`person-notes-${index}`}>Notes</Label>
                            <Textarea
                              id={`person-notes-${index}`}
                              value={person.notes || ''}
                              onChange={(e) => {
                                const updatedPeople = [...(editedClient?.hired_people || [])];
                                updatedPeople[index].notes = e.target.value;
                                setEditedClient({...editedClient!, hired_people: updatedPeople});
                              }}
                              placeholder="Additional notes"
                            />
                          </div>
                        </div>
                      ))}

                      <Button
                        variant="outline"
                        onClick={() => {
                          const newPerson = {
                            id: Date.now().toString(),
                            name: '',
                            role: '',
                            team_member_id: null,
                            external: true,
                            rate: 0,
                            notes: ''
                          };
                          const updatedPeople = [...(editedClient?.hired_people || []), newPerson];
                          setEditedClient({...editedClient!, hired_people: updatedPeople});
                        }}
                      >
                        Add Person
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {(client.hired_people || []).length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(client.hired_people || []).map((person: any, index: number) => (
                            <Card key={person.id || index} className="overflow-hidden">
                              <div className="bg-primary/10 p-4">
                                <div className="flex justify-between items-center">
                                  <h3 className="font-semibold">{person.name}</h3>
                                  {person.team_member_id && !person.external ? (
                                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">Team</span>
                                  ) : (
                                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">External</span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">{person.role}</p>
                              </div>
                              <div className="p-4 space-y-2">
                                {person.rate > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Rate:</span>
                                    <span>${person.rate}/hr</span>
                                  </div>
                                )}
                                {person.notes && (
                                  <div className="text-sm mt-2">
                                    <span className="text-muted-foreground block">Notes:</span>
                                    <p className="mt-1">{person.notes}</p>
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No hired people defined yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Folder Tab */}
            <TabsContent value="folder" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Folder className="h-5 w-5 mr-2" />
                    Video Folder
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="folder-path">Folder Path</Label>
                        <Input
                          id="folder-path"
                          value={editedClient?.video_folder?.path || ''}
                          onChange={(e) => {
                            const updatedFolder = { ...(editedClient?.video_folder || {}) };
                            updatedFolder.path = e.target.value;
                            setEditedClient({...editedClient!, video_folder: updatedFolder});
                          }}
                          placeholder="Path to the client's video folder"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-semibold">Links</h3>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const updatedFolder = { ...(editedClient?.video_folder || {}) };
                              if (!updatedFolder.links) updatedFolder.links = [];
                              updatedFolder.links.push({
                                id: Date.now().toString(),
                                title: '',
                                url: ''
                              });
                              setEditedClient({...editedClient!, video_folder: updatedFolder});
                            }}
                          >
                            Add Link
                          </Button>
                        </div>

                        {(editedClient?.video_folder?.links || []).length > 0 ? (
                          <div className="space-y-4">
                            {(editedClient?.video_folder?.links || []).map((link: any, index: number) => (
                              <div key={link.id} className="grid grid-cols-12 gap-2 items-start border p-3 rounded-md">
                                <div className="col-span-4">
                                  <Label htmlFor={`link-title-${link.id}`} className="text-xs">Title</Label>
                                  <Input
                                    id={`link-title-${link.id}`}
                                    value={link.title || ''}
                                    onChange={(e) => {
                                      const updatedFolder = { ...(editedClient?.video_folder || {}) };
                                      updatedFolder.links[index].title = e.target.value;
                                      setEditedClient({...editedClient!, video_folder: updatedFolder});
                                    }}
                                  />
                                </div>
                                <div className="col-span-7">
                                  <Label htmlFor={`link-url-${link.id}`} className="text-xs">URL</Label>
                                  <Input
                                    id={`link-url-${link.id}`}
                                    value={link.url || ''}
                                    onChange={(e) => {
                                      const updatedFolder = { ...(editedClient?.video_folder || {}) };
                                      updatedFolder.links[index].url = e.target.value;
                                      setEditedClient({...editedClient!, video_folder: updatedFolder});
                                    }}
                                  />
                                </div>
                                <div className="col-span-1 pt-5">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      const updatedFolder = { ...(editedClient?.video_folder || {}) };
                                      updatedFolder.links.splice(index, 1);
                                      setEditedClient({...editedClient!, video_folder: updatedFolder});
                                    }}
                                    className="h-8 w-8"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No links added yet.</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folder-notes">Notes</Label>
                        <Textarea
                          id="folder-notes"
                          value={editedClient?.video_folder?.notes || ''}
                          onChange={(e) => {
                            const updatedFolder = { ...(editedClient?.video_folder || {}) };
                            updatedFolder.notes = e.target.value;
                            setEditedClient({...editedClient!, video_folder: updatedFolder});
                          }}
                          placeholder="Additional notes about the video folder"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {client.video_folder?.path && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Folder Path</h3>
                          <div className="bg-muted p-3 rounded-md font-mono text-sm break-all">
                            {client.video_folder.path}
                          </div>
                        </div>
                      )}

                      {(client.video_folder?.links || []).length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Links</h3>
                          <div className="space-y-2">
                            {(client.video_folder?.links || []).map((link: any) => (
                              <div key={link.id} className="flex items-center space-x-2">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline flex items-center"
                                >
                                  <Folder className="h-4 w-4 mr-2" />
                                  {link.title || link.url}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {client.video_folder?.notes && (
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold">Notes</h3>
                          <div className="whitespace-pre-wrap text-sm">
                            {client.video_folder.notes}
                          </div>
                        </div>
                      )}

                      {!client.video_folder?.path && !(client.video_folder?.links || []).length && !client.video_folder?.notes && (
                        <p className="text-muted-foreground">No video folder information defined yet.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Video Description Tab */}
            <TabsContent value="description" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileVideo className="h-5 w-5 mr-2" />
                    Video Description
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      id="video_description"
                      rows={6}
                      value={editedClient?.video_description || ""}
                      onChange={(e) => setEditedClient({...editedClient!, video_description: e.target.value})}
                      placeholder="Video descriptions and metadata for the client"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {client.video_description || "No video description defined yet."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Client Account Details Tab */}
            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserCircle className="h-5 w-5 mr-2" />
                    Client Account Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      id="account_details"
                      rows={6}
                      value={editedClient?.account_details || ""}
                      onChange={(e) => setEditedClient({...editedClient!, account_details: e.target.value})}
                      placeholder="Client account details for content reposting"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {client.account_details || "No account details defined yet."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Tabs defaultValue="notes" className="w-full mt-6">
            <div className="border-b mb-4">
              <TabsList className="flex pb-2 -mb-px bg-transparent w-full">
                <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
                <TabsTrigger value="channels" className="flex-1">Channel Details</TabsTrigger>
                <TabsTrigger value="ideas" className="flex-1">Project Ideas</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="notes">
              <Card>
                <CardHeader>
                  <CardTitle>Client Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      id="notes"
                      rows={6}
                      value={editedClient?.notes || ""}
                      onChange={(e) => setEditedClient({...editedClient!, notes: e.target.value})}
                      placeholder="Add notes about this client"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {client.notes || "No notes available."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="channels">
              <Card>
                <CardHeader>
                  <CardTitle>Channel Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      id="channel_details"
                      rows={6}
                      value={editedClient?.channel_details || ""}
                      onChange={(e) => setEditedClient({...editedClient!, channel_details: e.target.value})}
                      placeholder="Add details about their channels, social media, etc."
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {client.channel_details || "No channel details available."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ideas">
              <Card>
                <CardHeader>
                  <CardTitle>Project Ideas</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <Textarea
                      id="project_ideas"
                      rows={6}
                      value={editedClient?.project_ideas || ""}
                      onChange={(e) => setEditedClient({...editedClient!, project_ideas: e.target.value})}
                      placeholder="Add project ideas for this client"
                    />
                  ) : (
                    <div className="whitespace-pre-wrap">
                      {client.project_ideas || "No project ideas available."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
