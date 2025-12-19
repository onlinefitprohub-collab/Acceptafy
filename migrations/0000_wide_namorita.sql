CREATE TABLE "admin_activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"target_user_id" varchar,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_emails" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"recipient_user_id" varchar,
	"recipient_email" varchar NOT NULL,
	"subject" text NOT NULL,
	"body" text NOT NULL,
	"email_type" varchar NOT NULL,
	"segment" varchar,
	"status" varchar DEFAULT 'sent',
	"sent_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "admin_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "agency_branding" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"agency_name" varchar,
	"logo_url" varchar,
	"primary_color" varchar DEFAULT '#a855f7',
	"secondary_color" varchar DEFAULT '#ec4899',
	"footer_text" text,
	"intro_text" text,
	"contact_email" varchar,
	"contact_phone" varchar,
	"website" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "agency_branding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"type" varchar DEFAULT 'info',
	"target_audience" varchar DEFAULT 'all',
	"is_active" boolean DEFAULT true,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_risk_scores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar,
	"subject" text,
	"template_name" varchar,
	"segment_name" varchar,
	"estimated_volume" integer,
	"overall_risk" varchar NOT NULL,
	"risk_score" integer DEFAULT 0,
	"risk_factors" jsonb,
	"predicted_open_rate" integer,
	"predicted_bounce_rate" integer,
	"predicted_complaint_rate" integer,
	"volume_vs_baseline" integer,
	"frequency_vs_baseline" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "competitor_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"competitor_email" text NOT NULL,
	"analysis" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar NOT NULL,
	"email" varchar NOT NULL,
	"message" text NOT NULL,
	"status" varchar DEFAULT 'unread',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "daily_usage_counters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"date" varchar NOT NULL,
	"grade_count" integer DEFAULT 0,
	"rewrite_count" integer DEFAULT 0,
	"followup_count" integer DEFAULT 0,
	"deliverability_checks" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "deliverability_alerts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"alert_type" varchar NOT NULL,
	"severity" varchar NOT NULL,
	"title" varchar NOT NULL,
	"message" text NOT NULL,
	"metric" varchar,
	"current_value" integer,
	"baseline_value" integer,
	"deviation_factor" integer,
	"domain" varchar,
	"campaign_id" varchar,
	"is_read" boolean DEFAULT false,
	"is_dismissed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_analyses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"subject" text,
	"preview_text" text,
	"body" text,
	"variations" jsonb,
	"result" jsonb NOT NULL,
	"score" integer,
	"grade" varchar,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" varchar NOT NULL,
	"subject" text,
	"preview_text" text,
	"body" text NOT NULL,
	"category" varchar,
	"last_score" integer,
	"last_grade" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "esp_baselines" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"domain" varchar,
	"avg_open_rate" integer DEFAULT 0,
	"avg_click_rate" integer DEFAULT 0,
	"avg_bounce_rate" integer DEFAULT 0,
	"avg_complaint_rate" integer DEFAULT 0,
	"avg_unsubscribe_rate" integer DEFAULT 0,
	"avg_delivery_rate" integer DEFAULT 0,
	"open_rate_std_dev" integer DEFAULT 0,
	"bounce_rate_std_dev" integer DEFAULT 0,
	"avg_campaign_volume" integer DEFAULT 0,
	"avg_sends_per_week" integer DEFAULT 0,
	"campaigns_analyzed" integer DEFAULT 0,
	"period_start" timestamp,
	"period_end" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "esp_campaign_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"campaign_id" varchar NOT NULL,
	"campaign_name" varchar,
	"subject" text,
	"sent_at" timestamp,
	"total_sent" integer DEFAULT 0,
	"delivered" integer DEFAULT 0,
	"opened" integer DEFAULT 0,
	"clicked" integer DEFAULT 0,
	"bounced" integer DEFAULT 0,
	"unsubscribed" integer DEFAULT 0,
	"spam_reports" integer DEFAULT 0,
	"open_rate" integer DEFAULT 0,
	"click_rate" integer DEFAULT 0,
	"bounce_rate" integer DEFAULT 0,
	"unsubscribe_rate" integer DEFAULT 0,
	"domain_stats" jsonb,
	"synced_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "esp_connections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"api_key" text,
	"api_url" text,
	"app_id" varchar,
	"access_token" text,
	"refresh_token" text,
	"account_name" varchar,
	"account_email" varchar,
	"is_connected" boolean DEFAULT false,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "list_health_snapshots" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"list_id" varchar NOT NULL,
	"list_name" varchar,
	"total_subscribers" integer DEFAULT 0,
	"active_subscribers" integer DEFAULT 0,
	"unsubscribed_count" integer DEFAULT 0,
	"bounced_count" integer DEFAULT 0,
	"complaints_count" integer DEFAULT 0,
	"avg_open_rate" integer DEFAULT 0,
	"avg_click_rate" integer DEFAULT 0,
	"growth_rate" integer DEFAULT 0,
	"subscribers_added" integer DEFAULT 0,
	"subscribers_lost" integer DEFAULT 0,
	"health_score" integer DEFAULT 50,
	"health_trend" varchar,
	"engagement_tier" varchar,
	"last_campaign_sent" timestamp,
	"snapshot_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"token" varchar NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "send_frequency_tracking" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"provider" varchar NOT NULL,
	"segment_name" varchar,
	"sends_this_week" integer DEFAULT 0,
	"sends_last_week" integer DEFAULT 0,
	"avg_sends_per_week" integer DEFAULT 0,
	"engagement_at_current_freq" integer,
	"optimal_frequency" integer,
	"frequency_risk" varchar,
	"unsubscribe_trend" varchar,
	"complaint_trend" varchar,
	"open_rate_trend" varchar,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "template_health" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"template_id" varchar,
	"template_name" varchar NOT NULL,
	"provider" varchar,
	"times_used" integer DEFAULT 0,
	"avg_open_rate" integer DEFAULT 0,
	"avg_click_rate" integer DEFAULT 0,
	"avg_bounce_rate" integer DEFAULT 0,
	"avg_complaint_rate" integer DEFAULT 0,
	"gmail_open_rate" integer,
	"outlook_open_rate" integer,
	"yahoo_open_rate" integer,
	"health_score" integer DEFAULT 50,
	"health_trend" varchar,
	"last_used_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "usage_counters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"period_start" timestamp NOT NULL,
	"period_end" timestamp NOT NULL,
	"grade_count" integer DEFAULT 0,
	"rewrite_count" integer DEFAULT 0,
	"followup_count" integer DEFAULT 0,
	"deliverability_checks" integer DEFAULT 0,
	"ai_tokens_used" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "user_activity_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"action" varchar NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_gamification" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"xp" integer DEFAULT 0,
	"level" integer DEFAULT 1,
	"streak" integer DEFAULT 0,
	"last_active_date" varchar,
	"achievements" jsonb DEFAULT '[]'::jsonb,
	"total_grades" integer DEFAULT 0,
	"best_score" integer DEFAULT 0,
	CONSTRAINT "user_gamification_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"stripe_customer_id" varchar,
	"stripe_subscription_id" varchar,
	"subscription_status" varchar DEFAULT 'active',
	"subscription_tier" varchar DEFAULT 'starter',
	"role" varchar DEFAULT 'user',
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_activity_logs" ADD CONSTRAINT "admin_activity_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_emails" ADD CONSTRAINT "admin_emails_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_emails" ADD CONSTRAINT "admin_emails_recipient_user_id_users_id_fk" FOREIGN KEY ("recipient_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agency_branding" ADD CONSTRAINT "agency_branding_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_risk_scores" ADD CONSTRAINT "campaign_risk_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitor_analyses" ADD CONSTRAINT "competitor_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_usage_counters" ADD CONSTRAINT "daily_usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deliverability_alerts" ADD CONSTRAINT "deliverability_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_analyses" ADD CONSTRAINT "email_analyses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esp_baselines" ADD CONSTRAINT "esp_baselines_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esp_campaign_history" ADD CONSTRAINT "esp_campaign_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "esp_connections" ADD CONSTRAINT "esp_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_health_snapshots" ADD CONSTRAINT "list_health_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "send_frequency_tracking" ADD CONSTRAINT "send_frequency_tracking_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "template_health" ADD CONSTRAINT "template_health_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity_logs" ADD CONSTRAINT "user_activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_gamification" ADD CONSTRAINT "user_gamification_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_admin_activity_admin" ON "admin_activity_logs" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_activity_date" ON "admin_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_admin_emails_admin" ON "admin_emails" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "idx_admin_emails_recipient" ON "admin_emails" USING btree ("recipient_user_id");--> statement-breakpoint
CREATE INDEX "idx_announcement_reads_user" ON "announcement_reads" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_announcement_reads_unique" ON "announcement_reads" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE INDEX "idx_announcements_active" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_risk_scores_user" ON "campaign_risk_scores" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_user" ON "deliverability_alerts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_alerts_unread" ON "deliverability_alerts" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_baselines_user_provider" ON "esp_baselines" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_user" ON "esp_campaign_history" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_provider" ON "esp_campaign_history" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "idx_campaign_history_sent" ON "esp_campaign_history" USING btree ("sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_campaign_history_unique" ON "esp_campaign_history" USING btree ("user_id","campaign_id");--> statement-breakpoint
CREATE INDEX "idx_list_health_user" ON "list_health_snapshots" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_list_health_provider" ON "list_health_snapshots" USING btree ("user_id","provider");--> statement-breakpoint
CREATE INDEX "idx_list_health_list" ON "list_health_snapshots" USING btree ("user_id","list_id");--> statement-breakpoint
CREATE INDEX "idx_list_health_date" ON "list_health_snapshots" USING btree ("snapshot_at");--> statement-breakpoint
CREATE INDEX "idx_frequency_user" ON "send_frequency_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");--> statement-breakpoint
CREATE INDEX "idx_template_health_user" ON "template_health" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_user" ON "user_activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_activity_date" ON "user_activity_logs" USING btree ("created_at");