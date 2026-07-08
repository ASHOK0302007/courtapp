/**
 * Hand-written types matching supabase/migrations/*.sql. Once the project
 * is linked to a live Supabase instance, regenerate this file from the
 * real schema with:
 *
 *   npm run supabase:types
 *
 * which runs `supabase gen types typescript`. Keep this file's shape in
 * sync with the SQL migrations until then.
 */

export type UserRole = "citizen" | "court_officer" | "judge" | "admin";

export type CaseStatus =
  | "submitted"
  | "under_review"
  | "verified"
  | "assigned"
  | "scheduled"
  | "in_hearing"
  | "judgment_published"
  | "closed"
  | "rejected"
  | "withdrawn";

export type HearingStatus = "scheduled" | "completed" | "postponed" | "cancelled";

export type DocumentType = "evidence" | "affidavit" | "identity_proof" | "prior_judgment" | "other";

export type DocumentReviewStatus = "pending" | "approved" | "rejected";

export type NotificationType =
  | "case_status_change"
  | "hearing_scheduled"
  | "hearing_rescheduled"
  | "judgment_published"
  | "document_requested"
  | "system";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: UserRole;
          bar_or_badge_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      cases: {
        Row: {
          id: string;
          case_number: string;
          title: string;
          description: string;
          case_type: string;
          priority: string;
          status: CaseStatus;
          citizen_id: string;
          assigned_officer_id: string | null;
          assigned_judge_id: string | null;
          filed_at: string;
          verified_at: string | null;
          closed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cases"]["Row"]> & {
          title: string;
          description: string;
          citizen_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["cases"]["Row"]>;
      };
      appeals: {
        Row: {
          id: string;
          case_id: string;
          appellant_id: string;
          grounds_for_appeal: string;
          original_judgment_ref: string | null;
          relief_sought: string;
          status: CaseStatus;
          submitted_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["appeals"]["Row"]> & {
          case_id: string;
          appellant_id: string;
          grounds_for_appeal: string;
          relief_sought: string;
        };
        Update: Partial<Database["public"]["Tables"]["appeals"]["Row"]>;
      };
      documents: {
        Row: {
          id: string;
          case_id: string;
          uploaded_by: string;
          document_type: DocumentType;
          file_name: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
          reviewed_by: string | null;
          review_status: DocumentReviewStatus;
          review_notes: string | null;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          case_id: string;
          uploaded_by: string;
          file_name: string;
          storage_path: string;
          file_size_bytes: number;
          mime_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
      };
      hearings: {
        Row: {
          id: string;
          case_id: string;
          scheduled_by: string;
          judge_id: string;
          hearing_date: string;
          location: string;
          status: HearingStatus;
          notes: string | null;
          next_hearing_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["hearings"]["Row"]> & {
          case_id: string;
          scheduled_by: string;
          judge_id: string;
          hearing_date: string;
          location: string;
        };
        Update: Partial<Database["public"]["Tables"]["hearings"]["Row"]>;
      };
      judgments: {
        Row: {
          id: string;
          case_id: string;
          judge_id: string;
          verdict_summary: string;
          full_text: string;
          document_storage_path: string | null;
          is_final: boolean;
          published_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["judgments"]["Row"]> & {
          case_id: string;
          judge_id: string;
          verdict_summary: string;
          full_text: string;
        };
        Update: Partial<Database["public"]["Tables"]["judgments"]["Row"]>;
      };
      notifications: {
        Row: {
          id: string;
          recipient_id: string;
          case_id: string | null;
          type: NotificationType;
          title: string;
          message: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          recipient_id: string;
          type: NotificationType;
          title: string;
          message: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
      };
      audit_log: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_table: string;
          entity_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_log"]["Row"]> & {
          action: string;
          entity_table: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Row"]>;
      };
      system_settings: {
        Row: {
          key: string;
          value: unknown;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["system_settings"]["Row"]> & {
          key: string;
          value: unknown;
        };
        Update: Partial<Database["public"]["Tables"]["system_settings"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_role: {
        Args: Record<string, never>;
        Returns: UserRole;
      };
    };
    Enums: {
      user_role: UserRole;
      case_status: CaseStatus;
      hearing_status: HearingStatus;
      document_type: DocumentType;
      document_review_status: DocumentReviewStatus;
      notification_type: NotificationType;
    };
  };
}
