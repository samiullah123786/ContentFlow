export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          name: string
          email: string | null
          status: string | null
          onboarding_document: string | null
          current_position: string | null
          created_at: string | null
          created_by: string | null
          notes: string | null
          channel_details: string | null
          project_ideas: string | null
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          status?: string | null
          onboarding_document?: string | null
          current_position?: string | null
          created_at?: string | null
          created_by?: string | null
          notes?: string | null
          channel_details?: string | null
          project_ideas?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          status?: string | null
          onboarding_document?: string | null
          current_position?: string | null
          created_at?: string | null
          created_by?: string | null
          notes?: string | null
          channel_details?: string | null
          project_ideas?: string | null
        }
      }
      ideas: {
        Row: {
          id: string
          client_id: string
          idea: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          idea?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          idea?: string | null
          created_at?: string | null
          created_by?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          client_id: string | null
          assigned_to: string | null
          status: 'pending' | 'in_progress' | 'completed' | 'canceled'
          timer_start: string | null
          timer_end: string | null
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          client_id?: string | null
          assigned_to?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'canceled'
          timer_start?: string | null
          timer_end?: string | null
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          client_id?: string | null
          assigned_to?: string | null
          status?: 'pending' | 'in_progress' | 'completed' | 'canceled'
          timer_start?: string | null
          timer_end?: string | null
          created_at?: string | null
          created_by?: string | null
        }
      }
      finances: {
        Row: {
          id: string
          client_id: string | null
          amount: number
          type: 'invoice' | 'payment' | 'expense'
          due_date: string | null
          status: 'pending' | 'paid' | 'completed'
          created_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          client_id?: string | null
          amount: number
          type: 'invoice' | 'payment' | 'expense'
          due_date?: string | null
          status?: 'pending' | 'paid' | 'completed'
          created_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string | null
          amount?: number
          type?: 'invoice' | 'payment' | 'expense'
          due_date?: string | null
          status?: 'pending' | 'paid' | 'completed'
          created_at?: string | null
          created_by?: string | null
        }
      }
    }
  }
}