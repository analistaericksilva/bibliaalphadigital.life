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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      bible_cross_references: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          refs: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          refs: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          refs?: string
          verse?: number
        }
        Relationships: []
      }
      bible_dictionary: {
        Row: {
          created_at: string
          definition: string
          hebrew_greek: string | null
          id: string
          references_list: Json | null
          term: string
        }
        Insert: {
          created_at?: string
          definition: string
          hebrew_greek?: string | null
          id?: string
          references_list?: Json | null
          term: string
        }
        Update: {
          created_at?: string
          definition?: string
          hebrew_greek?: string | null
          id?: string
          references_list?: Json | null
          term?: string
        }
        Relationships: []
      }
      bible_places: {
        Row: {
          created_at: string
          id: string
          lat: number
          lon: number
          name: string
          place_type: string
          refs: Json
        }
        Insert: {
          created_at?: string
          id?: string
          lat: number
          lon: number
          name: string
          place_type?: string
          refs?: Json
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number
          lon?: number
          name?: string
          place_type?: string
          refs?: Json
        }
        Relationships: []
      }
      bible_verses: {
        Row: {
          book_id: string
          book_name: string
          chapter: number
          created_at: string
          id: string
          testament: string
          text: string
          verse_number: number
        }
        Insert: {
          book_id: string
          book_name: string
          chapter: number
          created_at?: string
          id?: string
          testament: string
          text: string
          verse_number: number
        }
        Update: {
          book_id?: string
          book_name?: string
          chapter?: number
          created_at?: string
          id?: string
          testament?: string
          text?: string
          verse_number?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          book_id: string
          chapter: number
          created_at: string
          id: string
          label: string | null
          user_id: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          created_at?: string
          id?: string
          label?: string | null
          user_id: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          created_at?: string
          id?: string
          label?: string | null
          user_id?: string
          verse?: number
        }
        Relationships: []
      }
      highlights: {
        Row: {
          book_id: string
          chapter: number
          color: string
          created_at: string
          id: string
          user_id: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          color?: string
          created_at?: string
          id?: string
          user_id: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          color?: string
          created_at?: string
          id?: string
          user_id?: string
          verse?: number
        }
        Relationships: []
      }
      personal_notes: {
        Row: {
          book_id: string
          chapter: number
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          verse: number
        }
        Insert: {
          book_id: string
          chapter: number
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          verse: number
        }
        Update: {
          book_id?: string
          chapter?: number
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          verse?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_history: {
        Row: {
          book_id: string
          chapter: number
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          book_id: string
          chapter: number
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          book_id?: string
          chapter?: number
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reading_plan_days: {
        Row: {
          created_at: string
          day_number: number
          devotional_text: string | null
          id: string
          plan_id: string
          readings: Json
          title: string | null
        }
        Insert: {
          created_at?: string
          day_number: number
          devotional_text?: string | null
          id?: string
          plan_id: string
          readings?: Json
          title?: string | null
        }
        Update: {
          created_at?: string
          day_number?: number
          devotional_text?: string | null
          id?: string
          plan_id?: string
          readings?: Json
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reading_plan_days_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          total_days: number
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          total_days: number
          type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          total_days?: number
          type?: string
        }
        Relationships: []
      }
      study_notes: {
        Row: {
          book_id: string
          chapter: number
          content: string
          created_at: string
          id: string
          note_type: string
          source: string | null
          title: string | null
          verse_end: number | null
          verse_start: number
        }
        Insert: {
          book_id: string
          chapter: number
          content: string
          created_at?: string
          id?: string
          note_type?: string
          source?: string | null
          title?: string | null
          verse_end?: number | null
          verse_start: number
        }
        Update: {
          book_id?: string
          chapter?: number
          content?: string
          created_at?: string
          id?: string
          note_type?: string
          source?: string | null
          title?: string | null
          verse_end?: number | null
          verse_start?: number
        }
        Relationships: []
      }
      user_plan_progress: {
        Row: {
          completed_at: string
          day_number: number
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          day_number: number
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          day_number?: number
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_progress_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "reading_plans"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "subscriber" | "pending"
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
      app_role: ["admin", "subscriber", "pending"],
    },
  },
} as const
