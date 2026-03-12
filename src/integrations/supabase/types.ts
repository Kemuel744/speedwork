export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_code_attempts: {
        Row: {
          attempted_at: string
          id: string
          ip_hash: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          ip_hash: string
        }
        Update: {
          attempted_at?: string
          id?: string
          ip_hash?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string
          category: string
          content: string
          created_at: string
          created_by: string
          excerpt: string
          featured_image: string | null
          id: string
          keywords: string
          meta_description: string
          meta_title: string
          published_at: string | null
          reading_time: number
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          created_by: string
          excerpt?: string
          featured_image?: string | null
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          reading_time?: number
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author?: string
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          excerpt?: string
          featured_image?: string | null
          id?: string
          keywords?: string
          meta_description?: string
          meta_title?: string
          published_at?: string | null
          reading_time?: number
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      documents: {
        Row: {
          client_address: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          company_address: string | null
          company_bank_name: string | null
          company_bic: string | null
          company_brand_colors: Json | null
          company_currency: string | null
          company_custom_note: string | null
          company_description: string | null
          company_document_template: string | null
          company_email: string
          company_iban: string | null
          company_logo: string | null
          company_logo_position: string | null
          company_name: string
          company_phone: string | null
          company_signatory_title: string | null
          created_at: string
          date: string
          due_date: string | null
          id: string
          items: Json
          labor_cost: number
          number: string
          share_token: string | null
          status: string
          subject: string | null
          subtotal: number
          tax_amount: number
          tax_rate: number
          total: number
          type: string
          updated_at: string
          user_id: string
          withholding_amount: number
          withholding_rate: number
        }
        Insert: {
          client_address?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          company_address?: string | null
          company_bank_name?: string | null
          company_bic?: string | null
          company_brand_colors?: Json | null
          company_currency?: string | null
          company_custom_note?: string | null
          company_description?: string | null
          company_document_template?: string | null
          company_email: string
          company_iban?: string | null
          company_logo?: string | null
          company_logo_position?: string | null
          company_name: string
          company_phone?: string | null
          company_signatory_title?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          id?: string
          items?: Json
          labor_cost?: number
          number: string
          share_token?: string | null
          status?: string
          subject?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          type: string
          updated_at?: string
          user_id: string
          withholding_amount?: number
          withholding_rate?: number
        }
        Update: {
          client_address?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          company_address?: string | null
          company_bank_name?: string | null
          company_bic?: string | null
          company_brand_colors?: Json | null
          company_currency?: string | null
          company_custom_note?: string | null
          company_description?: string | null
          company_document_template?: string | null
          company_email?: string
          company_iban?: string | null
          company_logo?: string | null
          company_logo_position?: string | null
          company_name?: string
          company_phone?: string | null
          company_signatory_title?: string | null
          created_at?: string
          date?: string
          due_date?: string | null
          id?: string
          items?: Json
          labor_cost?: number
          number?: string
          share_token?: string | null
          status?: string
          subject?: string | null
          subtotal?: number
          tax_amount?: number
          tax_rate?: number
          total?: number
          type?: string
          updated_at?: string
          user_id?: string
          withholding_amount?: number
          withholding_rate?: number
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          expense_date: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          expense_date?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      field_report_images: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          report_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          report_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          report_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_report_images_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "field_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      field_reports: {
        Row: {
          created_at: string
          id: string
          intervention_date: string
          intervention_location: string | null
          observations: string | null
          recommendations: string | null
          reporter_name: string | null
          reporter_position: string | null
          status: string
          subject: string
          title: string
          updated_at: string
          user_id: string
          workers: Json
        }
        Insert: {
          created_at?: string
          id?: string
          intervention_date?: string
          intervention_location?: string | null
          observations?: string | null
          recommendations?: string | null
          reporter_name?: string | null
          reporter_position?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id: string
          workers?: Json
        }
        Update: {
          created_at?: string
          id?: string
          intervention_date?: string
          intervention_location?: string | null
          observations?: string | null
          recommendations?: string | null
          reporter_name?: string | null
          reporter_position?: string | null
          status?: string
          subject?: string
          title?: string
          updated_at?: string
          user_id?: string
          workers?: Json
        }
        Relationships: []
      }
      invoice_reminders: {
        Row: {
          document_id: string
          id: string
          message: string | null
          reminder_type: string
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          document_id: string
          id?: string
          message?: string | null
          reminder_type?: string
          sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          document_id?: string
          id?: string
          message?: string | null
          reminder_type?: string
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "shared_documents_view"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_resources: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          resource_type: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          resource_type?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          resource_type?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          parent_id: string | null
          receiver_id: string
          sender_id: string
          subject: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          parent_id?: string | null
          receiver_id: string
          sender_id: string
          subject?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          parent_id?: string | null
          receiver_id?: string
          sender_id?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_applications: {
        Row: {
          applicant_email: string
          applicant_name: string
          applicant_phone: string
          created_at: string
          id: string
          message: string
          mission_id: string
          status: string
          user_id: string
        }
        Insert: {
          applicant_email?: string
          applicant_name: string
          applicant_phone?: string
          created_at?: string
          id?: string
          message?: string
          mission_id: string
          status?: string
          user_id: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          applicant_phone?: string
          created_at?: string
          id?: string
          message?: string
          mission_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_applications_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          assigned_team_id: string | null
          assigned_worker_id: string | null
          created_at: string
          deadline: string | null
          description: string
          duration: string
          estimated_duration_hours: number
          id: string
          latitude: number | null
          location: string
          longitude: number | null
          mission_date: string | null
          priority: string
          salary: number
          salary_currency: string
          start_time: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          workers_needed: number
        }
        Insert: {
          assigned_team_id?: string | null
          assigned_worker_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          duration?: string
          estimated_duration_hours?: number
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          mission_date?: string | null
          priority?: string
          salary?: number
          salary_currency?: string
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workers_needed?: number
        }
        Update: {
          assigned_team_id?: string | null
          assigned_worker_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          duration?: string
          estimated_duration_hours?: number
          id?: string
          latitude?: number | null
          location?: string
          longitude?: number | null
          mission_date?: string | null
          priority?: string
          salary?: number
          salary_currency?: string
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workers_needed?: number
        }
        Relationships: [
          {
            foreignKeyName: "missions_assigned_team_id_fkey"
            columns: ["assigned_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "missions_assigned_worker_id_fkey"
            columns: ["assigned_worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          position: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          position?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          position?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          max_members: number
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_members?: number
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_members?: number
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll: {
        Row: {
          absence_penalty: number
          base_salary: number
          created_at: string
          days_absent: number
          days_worked: number
          gross_salary: number
          hours_worked: number
          id: string
          late_count: number
          late_penalty: number
          mission_bonus: number
          missions_completed: number
          month_year: string
          net_salary: number
          notes: string
          performance_bonus: number
          status: string
          updated_at: string
          user_id: string
          worker_id: string
        }
        Insert: {
          absence_penalty?: number
          base_salary?: number
          created_at?: string
          days_absent?: number
          days_worked?: number
          gross_salary?: number
          hours_worked?: number
          id?: string
          late_count?: number
          late_penalty?: number
          mission_bonus?: number
          missions_completed?: number
          month_year: string
          net_salary?: number
          notes?: string
          performance_bonus?: number
          status?: string
          updated_at?: string
          user_id: string
          worker_id: string
        }
        Update: {
          absence_penalty?: number
          base_salary?: number
          created_at?: string
          days_absent?: number
          days_worked?: number
          gross_salary?: number
          hours_worked?: number
          id?: string
          late_count?: number
          late_penalty?: number
          mission_bonus?: number
          missions_completed?: number
          month_year?: string
          net_salary?: number
          notes?: string
          performance_bonus?: number
          status?: string
          updated_at?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          alert_threshold: number
          category: string
          created_at: string
          description: string
          id: string
          name: string
          quantity_in_stock: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_threshold?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          name: string
          quantity_in_stock?: number
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_threshold?: number
          category?: string
          created_at?: string
          description?: string
          id?: string
          name?: string
          quantity_in_stock?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          company_name: string
          created_at: string
          email: string
          id: string
          logo_url: string | null
          phone: string | null
          trial_docs_used: number | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          trial_docs_used?: number | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string
          created_at?: string
          email?: string
          id?: string
          logo_url?: string | null
          phone?: string | null
          trial_docs_used?: number | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: string
          product_id: string
          quantity: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type?: string
          product_id: string
          quantity?: number
          reason?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: string
          product_id?: string
          quantity?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          access_code: string
          amount: number
          created_at: string
          end_date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_code: string
          amount: number
          created_at?: string
          end_date: string
          id?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_code?: string
          amount?: number
          created_at?: string
          end_date?: string
          id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          plan?: Database["public"]["Enums"]["subscription_plan"]
          start_date?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          is_leader: boolean
          team_id: string
          user_id: string
          worker_id: string | null
          worker_name: string
          worker_phone: string
          worker_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_leader?: boolean
          team_id: string
          user_id: string
          worker_id?: string | null
          worker_name: string
          worker_phone?: string
          worker_role?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_leader?: boolean
          team_id?: string
          user_id?: string
          worker_id?: string | null
          worker_name?: string
          worker_phone?: string
          worker_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string
          end_date: string | null
          id: string
          latitude: number | null
          leader_name: string
          leader_phone: string
          longitude: number | null
          name: string
          site_name: string
          start_date: string | null
          status: string
          team_type: string
          updated_at: string
          user_id: string
          zone: string
        }
        Insert: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          leader_name?: string
          leader_phone?: string
          longitude?: number | null
          name: string
          site_name?: string
          start_date?: string | null
          status?: string
          team_type?: string
          updated_at?: string
          user_id: string
          zone?: string
        }
        Update: {
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          latitude?: number | null
          leader_name?: string
          leader_phone?: string
          longitude?: number | null
          name?: string
          site_name?: string
          start_date?: string | null
          status?: string
          team_type?: string
          updated_at?: string
          user_id?: string
          zone?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          entry_type: string
          id: string
          latitude: number | null
          longitude: number | null
          mission_id: string | null
          notes: string
          photo_url: string | null
          timestamp: string
          user_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          entry_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mission_id?: string | null
          notes?: string
          photo_url?: string | null
          timestamp?: string
          user_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          entry_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mission_id?: string | null
          notes?: string
          photo_url?: string | null
          timestamp?: string
          user_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      work_proofs: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          mission_id: string | null
          notes: string
          photo_url: string
          proof_type: string
          task_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mission_id?: string | null
          notes?: string
          photo_url: string
          proof_type?: string
          task_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          mission_id?: string | null
          notes?: string
          photo_url?: string
          proof_type?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_proofs_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_proofs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "work_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      work_tasks: {
        Row: {
          assigned_to: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          status: string
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
          zone: string
        }
        Insert: {
          assigned_to?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          status?: string
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
          zone?: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          status?: string
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          base_salary: number
          contract_type: string
          created_at: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          linked_user_id: string | null
          phone: string
          photo_url: string | null
          position: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_salary?: number
          contract_type?: string
          created_at?: string
          first_name: string
          hire_date?: string
          id?: string
          last_name: string
          linked_user_id?: string | null
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_salary?: number
          contract_type?: string
          created_at?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          linked_user_id?: string | null
          phone?: string
          photo_url?: string | null
          position?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      shared_documents_view: {
        Row: {
          client_address: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          company_address: string | null
          company_bank_name: string | null
          company_bic: string | null
          company_brand_colors: Json | null
          company_currency: string | null
          company_custom_note: string | null
          company_description: string | null
          company_document_template: string | null
          company_email: string | null
          company_iban: string | null
          company_logo: string | null
          company_logo_position: string | null
          company_name: string | null
          company_phone: string | null
          company_signatory_title: string | null
          date: string | null
          due_date: string | null
          id: string | null
          items: Json | null
          labor_cost: number | null
          number: string | null
          share_token: string | null
          status: string | null
          subject: string | null
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total: number | null
          type: string | null
          withholding_amount: number | null
          withholding_rate: number | null
        }
        Insert: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_bank_name?: string | null
          company_bic?: string | null
          company_brand_colors?: Json | null
          company_currency?: string | null
          company_custom_note?: string | null
          company_description?: string | null
          company_document_template?: string | null
          company_email?: string | null
          company_iban?: string | null
          company_logo?: string | null
          company_logo_position?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_signatory_title?: string | null
          date?: string | null
          due_date?: string | null
          id?: string | null
          items?: Json | null
          labor_cost?: number | null
          number?: string | null
          share_token?: string | null
          status?: string | null
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          type?: string | null
          withholding_amount?: number | null
          withholding_rate?: number | null
        }
        Update: {
          client_address?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          company_address?: string | null
          company_bank_name?: string | null
          company_bic?: string | null
          company_brand_colors?: Json | null
          company_currency?: string | null
          company_custom_note?: string | null
          company_description?: string | null
          company_document_template?: string | null
          company_email?: string | null
          company_iban?: string | null
          company_logo?: string | null
          company_logo_position?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_signatory_title?: string | null
          date?: string | null
          due_date?: string | null
          id?: string | null
          items?: Json | null
          labor_cost?: number | null
          number?: string | null
          share_token?: string | null
          status?: string | null
          subject?: string | null
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total?: number | null
          type?: string | null
          withholding_amount?: number | null
          withholding_rate?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_admin_contacts: {
        Args: never
        Returns: {
          company_name: string
          email: string
          user_id: string
        }[]
      }
      get_my_subscription: {
        Args: never
        Returns: {
          amount: number
          end_date: string
          id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          plan: Database["public"]["Enums"]["subscription_plan"]
          start_date: string
          status: Database["public"]["Enums"]["subscription_status"]
        }[]
      }
      get_overdue_invoices: {
        Args: never
        Returns: {
          client_email: string
          client_name: string
          company_currency: string
          days_overdue: number
          document_id: string
          due_date: string
          last_reminder: string
          number: string
          total: number
          user_id: string
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_admin: { Args: { _user_id: string }; Returns: boolean }
      same_org: { Args: { _user1: string; _user2: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "client"
      payment_method:
        | "mtn_mobile_money"
        | "airtel_money"
        | "orange_money"
        | "bank_card"
      subscription_plan: "monthly" | "annual" | "enterprise"
      subscription_status: "active" | "expired" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "client"],
      payment_method: [
        "mtn_mobile_money",
        "airtel_money",
        "orange_money",
        "bank_card",
      ],
      subscription_plan: ["monthly", "annual", "enterprise"],
      subscription_status: ["active", "expired", "suspended"],
    },
  },
} as const
