CREATE TABLE "badge_awards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"badge_key" text NOT NULL,
	"awarded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"awarded_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "badges" (
	"key" text PRIMARY KEY NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"rule" text NOT NULL,
	"threshold" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"note" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	"decided_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_embed_microsites" (
	"embed_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_embed_microsites_embed_id_microsite_id_pk" PRIMARY KEY("embed_id","microsite_id")
);
--> statement-breakpoint
CREATE TABLE "ai_embeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"icon_url" text DEFAULT '' NOT NULL,
	"kind" text NOT NULL,
	"provider_id" text NOT NULL,
	"color" text DEFAULT '#EE3E43' NOT NULL,
	"script_url" text,
	"iframe_url" text,
	"requires_login" boolean DEFAULT true NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voice_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"embed_key" text DEFAULT 'voice-hiring' NOT NULL,
	"applicant" jsonb NOT NULL,
	"provider_session_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrolment_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"serial" text NOT NULL,
	"learner_name" text NOT NULL,
	"pdf_key" text,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"overview" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"level" text DEFAULT 'beginner' NOT NULL,
	"duration_min" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"sequential" boolean DEFAULT true NOT NULL,
	"certificate_enabled" boolean DEFAULT true NOT NULL,
	"external_certificate" boolean DEFAULT false NOT NULL,
	"coming_soon" boolean DEFAULT false NOT NULL,
	"is_cert_programme" boolean DEFAULT false NOT NULL,
	"points_config" jsonb DEFAULT '{"unit":10,"module":0,"course":50,"assessmentPass":20}'::jsonb NOT NULL,
	"legacy_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enrolments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"progress_pct" real DEFAULT 0 NOT NULL,
	"state" text DEFAULT 'not_started' NOT NULL,
	"next_unit_id" uuid,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsite_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"is_mandatory" boolean DEFAULT false NOT NULL,
	"track" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid,
	"source_type" text NOT NULL,
	"source_id" text NOT NULL,
	"points" integer NOT NULL,
	"reason" jsonb NOT NULL,
	"actor_id" uuid,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"judge_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"question" jsonb NOT NULL,
	"weight_pct" integer NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_judges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"user_id" uuid,
	"invitation_id" uuid,
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"closes_at" timestamp with time zone NOT NULL,
	"course_id" uuid NOT NULL,
	"eligibility_min_progress_pct" integer DEFAULT 80 NOT NULL,
	"rubric_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"opened_at" timestamp with time zone,
	"judging_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"judge_id" uuid NOT NULL,
	"submission_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"feedback" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"round_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'not_started' NOT NULL,
	"block_id" uuid,
	"submitted_at" timestamp with time zone,
	"scored_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_audiences" (
	"event_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_audiences_event_id_microsite_id_pk" PRIMARY KEY("event_id","microsite_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb NOT NULL,
	"description" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"category" text DEFAULT '' NOT NULL,
	"venue" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" text DEFAULT 'Asia/Dubai' NOT NULL,
	"zoom_url" text,
	"recording_url" text,
	"recording_published" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"cancelled_at" timestamp with time zone,
	"cancel_reason" text,
	"created_by_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"category" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"original_name" text DEFAULT '' NOT NULL,
	"owner_id" uuid,
	"visibility" text DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"user_id" uuid,
	"microsite_id" uuid,
	"answers" jsonb NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "form_microsites" (
	"form_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	CONSTRAINT "form_microsites_form_id_microsite_id_pk" PRIMARY KEY("form_id","microsite_id")
);
--> statement-breakpoint
CREATE TABLE "forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" jsonb NOT NULL,
	"kind" text NOT NULL,
	"fields" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"one_entry_per_user" boolean DEFAULT true NOT NULL,
	"show_on_dashboard" boolean DEFAULT false NOT NULL,
	"due_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"target_label" text,
	"microsite_id" uuid,
	"ip" "inet",
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"file_key" text,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"microsite_id" uuid,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'sent' NOT NULL,
	"message" text,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"invited_by_id" uuid,
	"accepted_by_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"resent_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"successful" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"remember_me" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" text DEFAULT '' NOT NULL,
	"last_name" text DEFAULT '' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"position" text DEFAULT '' NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"employment_type" text DEFAULT '' NOT NULL,
	"seniority_level" text DEFAULT '' NOT NULL,
	"linkedin_url" text DEFAULT '' NOT NULL,
	"mobile" text DEFAULT '' NOT NULL,
	"employee_id" text,
	"sector" text,
	"hire_date" text,
	"level" text,
	"time_at_dct" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" text DEFAULT 'learner' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"timezone" text DEFAULT 'Asia/Dubai' NOT NULL,
	"last_login_at" timestamp with time zone,
	"must_set_password" boolean DEFAULT false NOT NULL,
	"tour_seen" boolean DEFAULT false NOT NULL,
	"legacy_id" text,
	"anonymised_at" timestamp with time zone,
	"delete_requested_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "csv_imports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text NOT NULL,
	"scope" text NOT NULL,
	"token_hash" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rows" jsonb NOT NULL,
	"created_by_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"locked_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"last_error" text,
	"dedupe_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_schedules" (
	"name" text PRIMARY KEY NOT NULL,
	"last_run_at" timestamp with time zone,
	"last_status" text,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "action_plan_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"locked_at" timestamp with time zone,
	"pdf_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score_pct" real NOT NULL,
	"passed" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assessment_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assessment_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"text" jsonb NOT NULL,
	"type" text NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"points" integer DEFAULT 1 NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"position_sec" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"module_id" uuid,
	"unit_id" uuid,
	"title" jsonb NOT NULL,
	"type" text NOT NULL,
	"pass_mark" integer DEFAULT 70 NOT NULL,
	"attempts_allowed" integer DEFAULT 1 NOT NULL,
	"time_limit_min" integer,
	"shuffle" boolean DEFAULT false NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_blocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"type" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"required" boolean DEFAULT true NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_certificate_settings" (
	"course_id" uuid PRIMARY KEY NOT NULL,
	"background_url" text DEFAULT '' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"signature_name" text DEFAULT '' NOT NULL,
	"signature_title" text DEFAULT '' NOT NULL,
	"signature_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"title" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"module_id" uuid NOT NULL,
	"title" jsonb NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"duration_min" integer,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_packages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"version" text DEFAULT '1.2' NOT NULL,
	"launch_path" text DEFAULT '' NOT NULL,
	"file_count" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scorm_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"cmi" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_block_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"block_id" uuid NOT NULL,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unit_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"completed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booking_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"side" text NOT NULL,
	"rating" integer NOT NULL,
	"attendance" text NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grow_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"session_no" integer NOT NULL,
	"session_date" text NOT NULL,
	"goal" text NOT NULL,
	"reality" text NOT NULL,
	"options" text NOT NULL,
	"way_forward" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentee_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentee_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"match_score" real,
	"source" text DEFAULT 'rules' NOT NULL,
	"reason" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_availability_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"mentee_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"topic" text,
	"confirmed_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_id" uuid,
	"cancel_reason" text,
	"mentor_joined_at" timestamp with time zone,
	"mentee_joined_at" timestamp with time zone,
	"reminder_24h_sent_at" timestamp with time zone,
	"reminder_1h_sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentee_id" uuid NOT NULL,
	"mentor_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"application_id" uuid,
	"status" text DEFAULT 'active' NOT NULL,
	"source" text DEFAULT 'rules' NOT NULL,
	"match_score" real,
	"matched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_microsites" (
	"mentor_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mentor_microsites_mentor_id_microsite_id_pk" PRIMARY KEY("mentor_id","microsite_id")
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"bio" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"languages" jsonb DEFAULT '["en","ar"]'::jsonb NOT NULL,
	"linkedin_url" text DEFAULT '' NOT NULL,
	"photo" text DEFAULT '' NOT NULL,
	"kind" text DEFAULT 'mentor' NOT NULL,
	"course_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"booking_enabled" boolean DEFAULT true NOT NULL,
	"auto_confirm" boolean DEFAULT true NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"timezone" text DEFAULT 'Asia/Dubai' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mentor_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentoring_settings" (
	"microsite_id" uuid PRIMARY KEY NOT NULL,
	"registration_form_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "access_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "landing_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"preview_url" text DEFAULT '' NOT NULL,
	"sections" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"microsite_id" uuid NOT NULL,
	"source" text DEFAULT 'admin' NOT NULL,
	"last_visited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsite_landings" (
	"microsite_id" uuid PRIMARY KEY NOT NULL,
	"draft" jsonb NOT NULL,
	"published" jsonb,
	"published_at" timestamp with time zone,
	"published_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsite_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requested_by_id" uuid NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"note" text,
	"microsite_id" uuid,
	"decided_by_id" uuid,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "microsites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" jsonb NOT NULL,
	"subtitle" jsonb DEFAULT '{"en":"","ar":""}'::jsonb NOT NULL,
	"template_id" text DEFAULT 'standard' NOT NULL,
	"logo_url" text DEFAULT '' NOT NULL,
	"accent_color" text DEFAULT '#EE3E43' NOT NULL,
	"hero_url" text DEFAULT '' NOT NULL,
	"sub_admin_id" uuid,
	"sign_in_mode" text DEFAULT 'invite_only' NOT NULL,
	"email_domain_rule" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"landing_only" boolean DEFAULT false NOT NULL,
	"tabs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"default_filter" text,
	"mentoring_enabled" boolean DEFAULT false NOT NULL,
	"competition_enabled" boolean DEFAULT false NOT NULL,
	"ai_enabled" boolean DEFAULT true NOT NULL,
	"notification_recipients" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "register_interest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"message" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'nightly' NOT NULL,
	"for_date" text NOT NULL,
	"file_id" uuid NOT NULL,
	"rows" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_cache" (
	"key" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"computed_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "translation_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity" text NOT NULL,
	"record_id" text NOT NULL,
	"field" text NOT NULL,
	"status" text DEFAULT 'missing' NOT NULL,
	"queued_at" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"updated_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faq_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" jsonb NOT NULL,
	"answer" jsonb NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "page_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page" text NOT NULL,
	"key" text NOT NULL,
	"title" jsonb NOT NULL,
	"body" jsonb NOT NULL,
	"image_url" text,
	"cta" jsonb,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"microsite_id" uuid NOT NULL,
	"title" jsonb NOT NULL,
	"type" text NOT NULL,
	"url" text,
	"file_id" uuid,
	"image_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"submitted_by_id" uuid NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_badge_key_badges_key_fk" FOREIGN KEY ("badge_key") REFERENCES "public"."badges"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_awarded_by_id_users_id_fk" FOREIGN KEY ("awarded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "external_certificates" ADD CONSTRAINT "external_certificates_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_embed_microsites" ADD CONSTRAINT "ai_embed_microsites_embed_id_ai_embeds_id_fk" FOREIGN KEY ("embed_id") REFERENCES "public"."ai_embeds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_embed_microsites" ADD CONSTRAINT "ai_embed_microsites_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_enrolment_id_enrolments_id_fk" FOREIGN KEY ("enrolment_id") REFERENCES "public"."enrolments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificates" ADD CONSTRAINT "course_certificates_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrolments" ADD CONSTRAINT "enrolments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_courses" ADD CONSTRAINT "microsite_courses_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_courses" ADD CONSTRAINT "microsite_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_points_ledger" ADD CONSTRAINT "learning_points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_points_ledger" ADD CONSTRAINT "learning_points_ledger_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_points_ledger" ADD CONSTRAINT "learning_points_ledger_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_assignments" ADD CONSTRAINT "competition_assignments_submission_id_competition_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."competition_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_assignments" ADD CONSTRAINT "competition_assignments_judge_id_competition_judges_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."competition_judges"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_criteria" ADD CONSTRAINT "competition_criteria_round_id_competition_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."competition_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_judges" ADD CONSTRAINT "competition_judges_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_judges" ADD CONSTRAINT "competition_judges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_judges" ADD CONSTRAINT "competition_judges_invitation_id_invitations_id_fk" FOREIGN KEY ("invitation_id") REFERENCES "public"."invitations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rounds" ADD CONSTRAINT "competition_rounds_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rounds" ADD CONSTRAINT "competition_rounds_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_scores" ADD CONSTRAINT "competition_scores_judge_id_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_scores" ADD CONSTRAINT "competition_scores_submission_id_competition_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."competition_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_scores" ADD CONSTRAINT "competition_scores_criterion_id_competition_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."competition_criteria"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_submissions" ADD CONSTRAINT "competition_submissions_round_id_competition_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."competition_rounds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_submissions" ADD CONSTRAINT "competition_submissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_audiences" ADD CONSTRAINT "event_audiences_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_audiences" ADD CONSTRAINT "event_audiences_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_entries" ADD CONSTRAINT "form_entries_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_microsites" ADD CONSTRAINT "form_microsites_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "form_microsites" ADD CONSTRAINT "form_microsites_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_id_users_id_fk" FOREIGN KEY ("invited_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_accepted_by_id_users_id_fk" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "csv_imports" ADD CONSTRAINT "csv_imports_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan_answers" ADD CONSTRAINT "action_plan_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan_answers" ADD CONSTRAINT "action_plan_answers_block_id_course_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."course_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "action_plan_answers" ADD CONSTRAINT "action_plan_answers_pdf_file_id_files_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_assessment_id_course_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."course_assessments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_id_course_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."course_assessments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_progress" ADD CONSTRAINT "block_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_progress" ADD CONSTRAINT "block_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_progress" ADD CONSTRAINT "block_progress_unit_id_course_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_progress" ADD CONSTRAINT "block_progress_block_id_course_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."course_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_assessments" ADD CONSTRAINT "course_assessments_unit_id_course_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_blocks" ADD CONSTRAINT "course_blocks_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_blocks" ADD CONSTRAINT "course_blocks_unit_id_course_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_certificate_settings" ADD CONSTRAINT "course_certificate_settings_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_units" ADD CONSTRAINT "course_units_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_units" ADD CONSTRAINT "course_units_module_id_course_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."course_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_packages" ADD CONSTRAINT "scorm_packages_id_files_id_fk" FOREIGN KEY ("id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_packages" ADD CONSTRAINT "scorm_packages_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_states" ADD CONSTRAINT "scorm_states_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scorm_states" ADD CONSTRAINT "scorm_states_block_id_course_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."course_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_block_answers" ADD CONSTRAINT "survey_block_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_block_answers" ADD CONSTRAINT "survey_block_answers_block_id_course_blocks_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."course_blocks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unit_progress" ADD CONSTRAINT "unit_progress_unit_id_course_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."course_units"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_feedback" ADD CONSTRAINT "booking_feedback_booking_id_mentor_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."mentor_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_feedback" ADD CONSTRAINT "booking_feedback_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grow_logs" ADD CONSTRAINT "grow_logs_booking_id_mentor_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."mentor_bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grow_logs" ADD CONSTRAINT "grow_logs_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grow_logs" ADD CONSTRAINT "grow_logs_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_applications" ADD CONSTRAINT "mentee_applications_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_applications" ADD CONSTRAINT "mentee_applications_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentee_applications" ADD CONSTRAINT "mentee_applications_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_availability_rules" ADD CONSTRAINT "mentor_availability_rules_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_bookings" ADD CONSTRAINT "mentor_bookings_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_bookings" ADD CONSTRAINT "mentor_bookings_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_bookings" ADD CONSTRAINT "mentor_bookings_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_bookings" ADD CONSTRAINT "mentor_bookings_cancelled_by_id_users_id_fk" FOREIGN KEY ("cancelled_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_matches" ADD CONSTRAINT "mentor_matches_mentee_id_users_id_fk" FOREIGN KEY ("mentee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_matches" ADD CONSTRAINT "mentor_matches_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_matches" ADD CONSTRAINT "mentor_matches_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_matches" ADD CONSTRAINT "mentor_matches_application_id_mentee_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."mentee_applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_microsites" ADD CONSTRAINT "mentor_microsites_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_microsites" ADD CONSTRAINT "mentor_microsites_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_time_off" ADD CONSTRAINT "mentor_time_off_mentor_id_mentor_profiles_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."mentor_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_settings" ADD CONSTRAINT "mentoring_settings_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentoring_settings" ADD CONSTRAINT "mentoring_settings_registration_form_id_forms_id_fk" FOREIGN KEY ("registration_form_id") REFERENCES "public"."forms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_landings" ADD CONSTRAINT "microsite_landings_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_landings" ADD CONSTRAINT "microsite_landings_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_requests" ADD CONSTRAINT "microsite_requests_requested_by_id_users_id_fk" FOREIGN KEY ("requested_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_requests" ADD CONSTRAINT "microsite_requests_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsite_requests" ADD CONSTRAINT "microsite_requests_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "microsites" ADD CONSTRAINT "microsites_sub_admin_id_users_id_fk" FOREIGN KEY ("sub_admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "register_interest" ADD CONSTRAINT "register_interest_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_exports" ADD CONSTRAINT "progress_exports_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "translation_status" ADD CONSTRAINT "translation_status_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_microsite_id_microsites_id_fk" FOREIGN KEY ("microsite_id") REFERENCES "public"."microsites"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "badge_awards_user_badge_uq" ON "badge_awards" USING btree ("user_id","badge_key");--> statement-breakpoint
CREATE INDEX "badge_awards_badge_idx" ON "badge_awards" USING btree ("badge_key");--> statement-breakpoint
CREATE UNIQUE INDEX "external_certificates_user_course_uq" ON "external_certificates" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "external_certificates_status_idx" ON "external_certificates" USING btree ("status");--> statement-breakpoint
CREATE INDEX "external_certificates_course_idx" ON "external_certificates" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "external_certificates_microsite_idx" ON "external_certificates" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "external_certificates_file_idx" ON "external_certificates" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "ai_embed_microsites_microsite_idx" ON "ai_embed_microsites" USING btree ("microsite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_embeds_key_live_uq" ON "ai_embeds" USING btree ("key") WHERE "ai_embeds"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "voice_intakes_created_idx" ON "voice_intakes" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificates_enrolment_uq" ON "course_certificates" USING btree ("enrolment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "course_certificates_serial_uq" ON "course_certificates" USING btree ("serial");--> statement-breakpoint
CREATE INDEX "course_certificates_user_idx" ON "course_certificates" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_uq" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "courses_title_search_idx" ON "courses" USING gin (to_tsvector('simple', ("title"->>'en') || ' ' || ("title"->>'ar')));--> statement-breakpoint
CREATE UNIQUE INDEX "enrolments_user_course_uq" ON "enrolments" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "enrolments_course_idx" ON "enrolments" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microsite_courses_uq" ON "microsite_courses" USING btree ("microsite_id","course_id");--> statement-breakpoint
CREATE INDEX "microsite_courses_course_idx" ON "microsite_courses" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "points_ledger_source_uq" ON "learning_points_ledger" USING btree ("user_id","source_type","source_id");--> statement-breakpoint
CREATE INDEX "points_ledger_user_idx" ON "learning_points_ledger" USING btree ("user_id","at");--> statement-breakpoint
CREATE INDEX "points_ledger_course_idx" ON "learning_points_ledger" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_assignments_uq" ON "competition_assignments" USING btree ("submission_id","judge_id");--> statement-breakpoint
CREATE INDEX "competition_assignments_judge_idx" ON "competition_assignments" USING btree ("judge_id");--> statement-breakpoint
CREATE INDEX "competition_criteria_round_idx" ON "competition_criteria" USING btree ("round_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_judges_microsite_email_uq" ON "competition_judges" USING btree ("microsite_id","email");--> statement-breakpoint
CREATE INDEX "competition_judges_user_idx" ON "competition_judges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "competition_judges_invitation_idx" ON "competition_judges" USING btree ("invitation_id");--> statement-breakpoint
CREATE INDEX "competition_rounds_microsite_idx" ON "competition_rounds" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "competition_rounds_course_idx" ON "competition_rounds" USING btree ("course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_rounds_one_open_uq" ON "competition_rounds" USING btree ("microsite_id") WHERE "competition_rounds"."status" = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX "competition_scores_uq" ON "competition_scores" USING btree ("judge_id","submission_id","criterion_id");--> statement-breakpoint
CREATE INDEX "competition_scores_submission_idx" ON "competition_scores" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "competition_scores_criterion_idx" ON "competition_scores" USING btree ("criterion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_submissions_round_user_uq" ON "competition_submissions" USING btree ("round_id","user_id");--> statement-breakpoint
CREATE INDEX "competition_submissions_user_idx" ON "competition_submissions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "event_audiences_microsite_idx" ON "event_audiences" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "files_owner_idx" ON "files" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "form_entries_form_idx" ON "form_entries" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "form_entries_user_idx" ON "form_entries" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "form_entries_microsite_idx" ON "form_entries" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "form_microsites_microsite_idx" ON "form_microsites" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "accounts_user_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_at_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_hash_uq" ON "invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invitations_email_status_idx" ON "invitations" USING btree ("email","status");--> statement-breakpoint
CREATE INDEX "invitations_microsite_idx" ON "invitations" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "login_attempts_email_at_idx" ON "login_attempts" USING btree ("email","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_uq" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_uq" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_name_search_idx" ON "users" USING gin (to_tsvector('simple', "name" || ' ' || "email"));--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "csv_imports_token_uq" ON "csv_imports" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "csv_imports_one_pending_uq" ON "csv_imports" USING btree ("kind","scope") WHERE "csv_imports"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "csv_imports_created_by_idx" ON "csv_imports" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "job_runs_due_idx" ON "job_runs" USING btree ("status","run_at");--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_dedupe_uq" ON "job_runs" USING btree ("dedupe_key");--> statement-breakpoint
CREATE UNIQUE INDEX "action_plan_answers_user_block_uq" ON "action_plan_answers" USING btree ("user_id","block_id");--> statement-breakpoint
CREATE INDEX "action_plan_answers_block_idx" ON "action_plan_answers" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_user_idx" ON "assessment_attempts" USING btree ("user_id","assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_attempts_assessment_idx" ON "assessment_attempts" USING btree ("assessment_id");--> statement-breakpoint
CREATE INDEX "assessment_questions_assessment_idx" ON "assessment_questions" USING btree ("assessment_id","version");--> statement-breakpoint
CREATE UNIQUE INDEX "block_progress_user_block_uq" ON "block_progress" USING btree ("user_id","block_id");--> statement-breakpoint
CREATE INDEX "block_progress_user_course_idx" ON "block_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "block_progress_block_idx" ON "block_progress" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "course_assessments_course_idx" ON "course_assessments" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_assessments_unit_idx" ON "course_assessments" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "course_assessments_module_idx" ON "course_assessments" USING btree ("module_id");--> statement-breakpoint
CREATE INDEX "course_blocks_unit_idx" ON "course_blocks" USING btree ("unit_id");--> statement-breakpoint
CREATE INDEX "course_blocks_course_idx" ON "course_blocks" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_modules_course_idx" ON "course_modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_units_course_idx" ON "course_units" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "course_units_module_idx" ON "course_units" USING btree ("module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scorm_states_user_block_uq" ON "scorm_states" USING btree ("user_id","block_id");--> statement-breakpoint
CREATE INDEX "scorm_states_block_idx" ON "scorm_states" USING btree ("block_id");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_block_answers_user_block_uq" ON "survey_block_answers" USING btree ("user_id","block_id");--> statement-breakpoint
CREATE INDEX "survey_block_answers_block_idx" ON "survey_block_answers" USING btree ("block_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_progress_user_unit_uq" ON "unit_progress" USING btree ("user_id","unit_id");--> statement-breakpoint
CREATE INDEX "unit_progress_user_course_idx" ON "unit_progress" USING btree ("user_id","course_id");--> statement-breakpoint
CREATE INDEX "unit_progress_unit_idx" ON "unit_progress" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_feedback_side_uq" ON "booking_feedback" USING btree ("booking_id","side");--> statement-breakpoint
CREATE INDEX "booking_feedback_author_idx" ON "booking_feedback" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "grow_logs_booking_uq" ON "grow_logs" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "grow_logs_mentor_idx" ON "grow_logs" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "grow_logs_mentee_idx" ON "grow_logs" USING btree ("mentee_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentee_applications_pending_uq" ON "mentee_applications" USING btree ("mentee_id","microsite_id") WHERE "mentee_applications"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "mentee_applications_mentor_idx" ON "mentee_applications" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentee_applications_microsite_idx" ON "mentee_applications" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "mentor_availability_rules_mentor_idx" ON "mentor_availability_rules" USING btree ("mentor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_bookings_slot_uq" ON "mentor_bookings" USING btree ("mentor_id","starts_at") WHERE "mentor_bookings"."status" <> 'cancelled';--> statement-breakpoint
CREATE INDEX "mentor_bookings_mentor_starts_idx" ON "mentor_bookings" USING btree ("mentor_id","starts_at");--> statement-breakpoint
CREATE INDEX "mentor_bookings_mentee_idx" ON "mentor_bookings" USING btree ("mentee_id");--> statement-breakpoint
CREATE INDEX "mentor_bookings_microsite_idx" ON "mentor_bookings" USING btree ("microsite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_matches_active_uq" ON "mentor_matches" USING btree ("mentee_id","microsite_id") WHERE "mentor_matches"."status" = 'active';--> statement-breakpoint
CREATE INDEX "mentor_matches_mentor_idx" ON "mentor_matches" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "mentor_matches_microsite_idx" ON "mentor_matches" USING btree ("microsite_id");--> statement-breakpoint
CREATE INDEX "mentor_microsites_microsite_idx" ON "mentor_microsites" USING btree ("microsite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "mentor_profiles_user_uq" ON "mentor_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "mentor_time_off_mentor_idx" ON "mentor_time_off" USING btree ("mentor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "access_requests_open_uq" ON "access_requests" USING btree ("user_id","microsite_id") WHERE "access_requests"."status" = 'open';--> statement-breakpoint
CREATE UNIQUE INDEX "memberships_user_microsite_uq" ON "memberships" USING btree ("user_id","microsite_id");--> statement-breakpoint
CREATE INDEX "memberships_microsite_idx" ON "memberships" USING btree ("microsite_id");--> statement-breakpoint
CREATE UNIQUE INDEX "microsites_slug_uq" ON "microsites" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "microsites_sub_admin_idx" ON "microsites" USING btree ("sub_admin_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_exports_kind_date_uq" ON "progress_exports" USING btree ("kind","for_date");--> statement-breakpoint
CREATE INDEX "progress_exports_file_idx" ON "progress_exports" USING btree ("file_id");--> statement-breakpoint
CREATE UNIQUE INDEX "translation_status_field_uq" ON "translation_status" USING btree ("entity","record_id","field");--> statement-breakpoint
CREATE INDEX "translation_status_queue_idx" ON "translation_status" USING btree ("queued_at");--> statement-breakpoint
CREATE UNIQUE INDEX "page_sections_page_key_uq" ON "page_sections" USING btree ("page","key");--> statement-breakpoint
CREATE INDEX "resources_microsite_status_idx" ON "resources" USING btree ("microsite_id","status");--> statement-breakpoint
CREATE INDEX "resources_status_idx" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "resources_file_idx" ON "resources" USING btree ("file_id");--> statement-breakpoint
CREATE INDEX "resources_submitted_by_idx" ON "resources" USING btree ("submitted_by_id");--> statement-breakpoint
CREATE INDEX "resources_reviewed_by_idx" ON "resources" USING btree ("reviewed_by_id");