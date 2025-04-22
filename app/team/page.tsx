"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { Edit, Trash2, Plus, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type TeamMember = {
  id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  skills?: string[] | null;
  hourly_rate?: number | null;
  status?: string | null;
  created_at?: string | null;
  created_by?: string | null;
};

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: "",
    email: "",
    role: "",
    skills: [],
    hourly_rate: 0,
    status: "active",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  async function fetchTeamMembers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
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
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTeamMember(e: React.FormEvent) {
    e.preventDefault();

    if (!newMember.name) {
      toast({
        variant: "destructive",
        title: "Name is required",
        description: "Please enter a name for the team member.",
      });
      return;
    }

    setActionLoading(true);

    try {
      // If editing, update the existing team member
      if (editingMember) {
        const { error } = await supabase
          .from("team_members")
          .update({
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            skills: newMember.skills,
            hourly_rate: newMember.hourly_rate,
            status: newMember.status,
          })
          .eq("id", editingMember.id);

        if (error) throw error;

        toast({
          title: "Team member updated successfully",
        });
      } else {
        // Otherwise, insert a new team member
        const { error } = await supabase
          .from("team_members")
          .insert({
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            skills: newMember.skills,
            hourly_rate: newMember.hourly_rate,
            status: newMember.status,
          });

        if (error) throw error;

        toast({
          title: "Team member added successfully",
        });
      }

      // Reset form and refresh data
      setNewMember({
        name: "",
        email: "",
        role: "",
        skills: [],
        hourly_rate: 0,
        status: "active",
      });
      setEditingMember(null);
      setIsAddDialogOpen(false);
      fetchTeamMembers();
    } catch (error) {
      console.error("Error saving team member:", error);
      toast({
        variant: "destructive",
        title: "Error saving team member",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEditTeamMember(member: TeamMember) {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      email: member.email,
      role: member.role,
      skills: member.skills,
      hourly_rate: member.hourly_rate,
      status: member.status,
    });
    setIsAddDialogOpen(true);
  }

  async function handleDeleteTeamMember(id: string) {
    if (!confirm("Are you sure you want to delete this team member? This action cannot be undone.")) {
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("id", id);

      if (error) throw error;
      fetchTeamMembers();
      toast({
        title: "Team member deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting team member:", error);
      toast({
        variant: "destructive",
        title: "Error deleting team member",
        description: "Please try again later.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function handleSkillsChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const skillsText = e.target.value;
    const skillsArray = skillsText
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill !== '');
    
    setNewMember({
      ...newMember,
      skills: skillsArray
    });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
            <h1 className="text-4xl font-bold ml-4">Team</h1>
          </div>
          <p className="text-muted-foreground mt-2">Manage your team members</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>{editingMember ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
              <DialogDescription>
                {editingMember ? "Update the team member details." : "Add a new team member to your organization."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddTeamMember}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newMember.name || ''}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newMember.email || ''}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={newMember.role || ''}
                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="skills" className="text-right pt-2">
                    Skills
                  </Label>
                  <Textarea
                    id="skills"
                    value={newMember.skills?.join(', ') || ''}
                    onChange={handleSkillsChange}
                    placeholder="Enter skills separated by commas"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="hourly_rate" className="text-right">
                    Hourly Rate
                  </Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={newMember.hourly_rate || ''}
                    onChange={(e) => setNewMember({ ...newMember, hourly_rate: parseFloat(e.target.value) || 0 })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={newMember.status || 'active'}
                    onValueChange={(value) => setNewMember({ ...newMember, status: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                {editingMember && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setEditingMember(null);
                      setNewMember({
                        name: "",
                        email: "",
                        role: "",
                        skills: [],
                        hourly_rate: 0,
                        status: "active",
                      });
                    }}
                    className="mr-auto"
                  >
                    Cancel Edit
                  </Button>
                )}
                <Button type="submit" disabled={actionLoading}>
                  {actionLoading ? "Saving..." : editingMember ? "Update Member" : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : teamMembers.length === 0 ? (
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Team Members Yet</h2>
          <p className="text-muted-foreground mb-6">Add your first team member to get started.</p>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <Card key={member.id} className="overflow-hidden">
              <div className={`bg-primary/10 p-4 ${member.status === 'inactive' ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">{member.name}</h3>
                  {member.status === 'inactive' && (
                    <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{member.role || 'No role specified'}</p>
              </div>
              <CardContent className="p-4 space-y-4">
                {member.email && (
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground mr-2">Email:</span>
                    <a href={`mailto:${member.email}`} className="text-primary hover:underline">{member.email}</a>
                  </div>
                )}
                
                {member.hourly_rate !== null && member.hourly_rate > 0 && (
                  <div className="flex items-center text-sm">
                    <span className="text-muted-foreground mr-2">Rate:</span>
                    <span>${member.hourly_rate}/hr</span>
                  </div>
                )}
                
                {member.skills && member.skills.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Skills:</span>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="bg-primary/10 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditTeamMember(member)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteTeamMember(member.id)}
                    className="flex-1 text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
