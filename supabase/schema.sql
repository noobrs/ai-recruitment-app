


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."application_status_enum" AS ENUM (
    'unknown',
    'received',
    'shortlisted',
    'rejected',
    'withdrawn'
);


ALTER TYPE "public"."application_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."job_requirement_enum" AS ENUM (
    'skill',
    'experience',
    'education'
);


ALTER TYPE "public"."job_requirement_enum" OWNER TO "postgres";


CREATE TYPE "public"."job_status_enum" AS ENUM (
    'draft',
    'open',
    'closed',
    'deleted'
);


ALTER TYPE "public"."job_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."notification_type_enum" AS ENUM (
    'resume',
    'application',
    'general'
);


ALTER TYPE "public"."notification_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."resume_status_enum" AS ENUM (
    'uploaded',
    'deleted',
    'processed'
);


ALTER TYPE "public"."resume_status_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_role_enum" AS ENUM (
    'jobseeker',
    'recruiter'
);


ALTER TYPE "public"."user_role_enum" OWNER TO "postgres";


CREATE TYPE "public"."user_status_enum" AS ENUM (
    'pending',
    'active',
    'inactive'
);


ALTER TYPE "public"."user_status_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_incomplete_users"("older_than_days" integer DEFAULT 7) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete users who have been pending for more than X days
  WITH deleted AS (
    DELETE FROM public.users
    WHERE status = 'pending'
    AND created_at < NOW() - (older_than_days || ' days')::INTERVAL
    AND role IS NULL -- No role assigned means never started onboarding
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;


ALTER FUNCTION "public"."cleanup_incomplete_users"("older_than_days" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Insert basic user record when auth user is created
  -- Role will be set during onboarding based on which portal they used
  INSERT INTO public.users (
    id,
    status,
    created_at
  )
  VALUES (
    NEW.id,
    'pending', -- User needs to complete onboarding
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicates if trigger fires multiple times
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_user_onboarded"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_status TEXT;
  user_role TEXT;
  has_role_profile BOOLEAN;
BEGIN
  -- Get user status and role
  SELECT status, role INTO user_status, user_role
  FROM public.users
  WHERE id = user_id;
  
  -- If no user record, not onboarded
  IF user_status IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If status is pending, not onboarded
  IF user_status = 'pending' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if role-specific profile exists
  IF user_role = 'jobseeker' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.job_seeker WHERE user_id = user_id
    ) INTO has_role_profile;
  ELSIF user_role = 'recruiter' THEN
    SELECT EXISTS(
      SELECT 1 FROM public.recruiter WHERE user_id = user_id
    ) INTO has_role_profile;
  ELSE
    RETURN FALSE;
  END IF;
  
  RETURN has_role_profile;
END;
$$;


ALTER FUNCTION "public"."is_user_onboarded"("user_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."application" (
    "application_id" integer NOT NULL,
    "job_seeker_id" integer NOT NULL,
    "job_id" integer NOT NULL,
    "resume_id" integer,
    "match_score" real DEFAULT 0,
    "is_bookmark" boolean DEFAULT false,
    "status" "public"."application_status_enum" DEFAULT 'unknown'::"public"."application_status_enum" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."application" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."application_application_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."application_application_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."application_application_id_seq" OWNED BY "public"."application"."application_id";



CREATE TABLE IF NOT EXISTS "public"."company" (
    "company_id" integer NOT NULL,
    "comp_name" "text" NOT NULL,
    "comp_industry" "text",
    "comp_website" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "comp_logo_path" "text",
    "comp_size" "text",
    "comp_location" "text",
    "comp_rating" real,
    "comp_description" "text",
    "comp_founded" smallint DEFAULT EXTRACT(year FROM CURRENT_DATE) NOT NULL
);


ALTER TABLE "public"."company" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."company_company_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."company_company_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."company_company_id_seq" OWNED BY "public"."company"."company_id";



CREATE TABLE IF NOT EXISTS "public"."job" (
    "job_id" integer NOT NULL,
    "recruiter_id" integer NOT NULL,
    "job_title" "text" NOT NULL,
    "job_description" "text",
    "job_location" "text",
    "job_benefits" "text",
    "job_type" "text",
    "job_mode" "text",
    "job_industry" "text",
    "salary_range" "text",
    "job_status" "public"."job_status_enum" DEFAULT 'open'::"public"."job_status_enum",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."job" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."job_job_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."job_job_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."job_job_id_seq" OWNED BY "public"."job"."job_id";



CREATE TABLE IF NOT EXISTS "public"."job_requirement" (
    "job_requirement_id" integer NOT NULL,
    "job_id" integer NOT NULL,
    "requirement" "text" NOT NULL,
    "normalized_requirement" "text",
    "type" "public"."job_requirement_enum" NOT NULL,
    "weightage" real DEFAULT '0.5'::real NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_requirement" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."job_requirement_job_requirement_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."job_requirement_job_requirement_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."job_requirement_job_requirement_id_seq" OWNED BY "public"."job_requirement"."job_requirement_id";



CREATE TABLE IF NOT EXISTS "public"."job_seeker" (
    "job_seeker_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "about_me" "text",
    "location" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."job_seeker" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."job_seeker_job_seeker_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."job_seeker_job_seeker_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."job_seeker_job_seeker_id_seq" OWNED BY "public"."job_seeker"."job_seeker_id";



CREATE TABLE IF NOT EXISTS "public"."notification" (
    "notification_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "application_id" integer,
    "message" "text" NOT NULL,
    "type" "public"."notification_type_enum",
    "opened_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."notification" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."notification_notification_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."notification_notification_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."notification_notification_id_seq" OWNED BY "public"."notification"."notification_id";



CREATE TABLE IF NOT EXISTS "public"."recruiter" (
    "recruiter_id" integer NOT NULL,
    "user_id" "uuid" NOT NULL,
    "company_id" integer NOT NULL,
    "position" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."recruiter" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."recruiter_recruiter_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."recruiter_recruiter_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."recruiter_recruiter_id_seq" OWNED BY "public"."recruiter"."recruiter_id";



CREATE TABLE IF NOT EXISTS "public"."resume" (
    "resume_id" integer NOT NULL,
    "job_seeker_id" integer NOT NULL,
    "is_profile" boolean DEFAULT false,
    "original_file_path" "text" NOT NULL,
    "redacted_file_path" "text",
    "extracted_skills" "text",
    "extracted_education" "text",
    "extracted_experiences" "text",
    "status" "public"."resume_status_enum" DEFAULT 'uploaded'::"public"."resume_status_enum",
    "feedback" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone,
    "filename" "text"
);


ALTER TABLE "public"."resume" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."resume_resume_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."resume_resume_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."resume_resume_id_seq" OWNED BY "public"."resume"."resume_id";



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "profile_picture_path" "text",
    "status" "public"."user_status_enum" DEFAULT 'pending'::"public"."user_status_enum",
    "role" "public"."user_role_enum",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."application" ALTER COLUMN "application_id" SET DEFAULT "nextval"('"public"."application_application_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."company" ALTER COLUMN "company_id" SET DEFAULT "nextval"('"public"."company_company_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."job" ALTER COLUMN "job_id" SET DEFAULT "nextval"('"public"."job_job_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."job_requirement" ALTER COLUMN "job_requirement_id" SET DEFAULT "nextval"('"public"."job_requirement_job_requirement_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."job_seeker" ALTER COLUMN "job_seeker_id" SET DEFAULT "nextval"('"public"."job_seeker_job_seeker_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."notification" ALTER COLUMN "notification_id" SET DEFAULT "nextval"('"public"."notification_notification_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."recruiter" ALTER COLUMN "recruiter_id" SET DEFAULT "nextval"('"public"."recruiter_recruiter_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."resume" ALTER COLUMN "resume_id" SET DEFAULT "nextval"('"public"."resume_resume_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_pkey" PRIMARY KEY ("application_id");



ALTER TABLE ONLY "public"."company"
    ADD CONSTRAINT "company_pkey" PRIMARY KEY ("company_id");



ALTER TABLE ONLY "public"."job"
    ADD CONSTRAINT "job_pkey" PRIMARY KEY ("job_id");



ALTER TABLE ONLY "public"."job_requirement"
    ADD CONSTRAINT "job_requirement_pkey" PRIMARY KEY ("job_requirement_id");



ALTER TABLE ONLY "public"."job_seeker"
    ADD CONSTRAINT "job_seeker_pkey" PRIMARY KEY ("job_seeker_id");



ALTER TABLE ONLY "public"."job_seeker"
    ADD CONSTRAINT "job_seeker_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_pkey" PRIMARY KEY ("notification_id");



ALTER TABLE ONLY "public"."recruiter"
    ADD CONSTRAINT "recruiter_pkey" PRIMARY KEY ("recruiter_id");



ALTER TABLE ONLY "public"."recruiter"
    ADD CONSTRAINT "recruiter_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."resume"
    ADD CONSTRAINT "resume_pkey" PRIMARY KEY ("resume_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_application_job" ON "public"."application" USING "btree" ("job_id");



CREATE INDEX "idx_application_job_seeker" ON "public"."application" USING "btree" ("job_seeker_id");



CREATE INDEX "idx_job_recruiter" ON "public"."job" USING "btree" ("recruiter_id");



CREATE INDEX "idx_job_requirement_job" ON "public"."job_requirement" USING "btree" ("job_id");



CREATE INDEX "idx_jobseeker_user" ON "public"."job_seeker" USING "btree" ("user_id");



CREATE INDEX "idx_notification_user" ON "public"."notification" USING "btree" ("user_id");



CREATE INDEX "idx_recruiter_company" ON "public"."recruiter" USING "btree" ("company_id");



CREATE INDEX "idx_recruiter_user" ON "public"."recruiter" USING "btree" ("user_id");



CREATE INDEX "idx_resume_job_seeker" ON "public"."resume" USING "btree" ("job_seeker_id");



CREATE UNIQUE INDEX "uq_resume_profile_one" ON "public"."resume" USING "btree" ("job_seeker_id") WHERE ("is_profile" = true);



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("job_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_job_seeker_id_fkey" FOREIGN KEY ("job_seeker_id") REFERENCES "public"."job_seeker"("job_seeker_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."application"
    ADD CONSTRAINT "application_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "public"."resume"("resume_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job"
    ADD CONSTRAINT "job_recruiter_id_fkey" FOREIGN KEY ("recruiter_id") REFERENCES "public"."recruiter"("recruiter_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_requirement"
    ADD CONSTRAINT "job_requirement_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."job"("job_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_seeker"
    ADD CONSTRAINT "job_seeker_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."application"("application_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification"
    ADD CONSTRAINT "notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recruiter"
    ADD CONSTRAINT "recruiter_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."company"("company_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."recruiter"
    ADD CONSTRAINT "recruiter_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."resume"
    ADD CONSTRAINT "resume_job_seeker_id_fkey" FOREIGN KEY ("job_seeker_id") REFERENCES "public"."job_seeker"("job_seeker_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Anyone can view active jobs" ON "public"."job" FOR SELECT TO "authenticated" USING (("job_status" = 'open'::"public"."job_status_enum"));



CREATE POLICY "Anyone can view companies" ON "public"."company" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view requirements for active jobs" ON "public"."job_requirement" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."job"
  WHERE (("job"."job_id" = "job_requirement"."job_id") AND ("job"."job_status" = 'open'::"public"."job_status_enum")))));



CREATE POLICY "Auth service can insert user rows" ON "public"."users" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "Auth service can select user rows" ON "public"."users" FOR SELECT TO "service_role" USING (true);



CREATE POLICY "Auth service can update user rows" ON "public"."users" FOR UPDATE TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Job seekers can delete own resumes" ON "public"."resume" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "resume"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can insert own applications" ON "public"."application" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "application"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can insert own profile" ON "public"."job_seeker" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Job seekers can insert own resumes" ON "public"."resume" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "resume"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can update own applications" ON "public"."application" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "application"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can update own profile" ON "public"."job_seeker" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Job seekers can update own resumes" ON "public"."resume" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "resume"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can view own applications" ON "public"."application" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "application"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Job seekers can view own profile" ON "public"."job_seeker" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Job seekers can view own resumes" ON "public"."resume" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."job_seeker"
  WHERE (("job_seeker"."job_seeker_id" = "resume"."job_seeker_id") AND ("job_seeker"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can delete own jobs" ON "public"."job" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."recruiter"
  WHERE (("recruiter"."recruiter_id" = "job"."recruiter_id") AND ("recruiter"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can insert companies" ON "public"."company" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'recruiter'::"public"."user_role_enum")))));



CREATE POLICY "Recruiters can insert own jobs" ON "public"."job" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."recruiter"
  WHERE (("recruiter"."recruiter_id" = "job"."recruiter_id") AND ("recruiter"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can insert own profile" ON "public"."recruiter" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Recruiters can manage own job requirements" ON "public"."job_requirement" USING ((EXISTS ( SELECT 1
   FROM ("public"."job" "j"
     JOIN "public"."recruiter" "r" ON (("j"."recruiter_id" = "r"."recruiter_id")))
  WHERE (("j"."job_id" = "job_requirement"."job_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can update application status" ON "public"."application" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."job" "j"
     JOIN "public"."recruiter" "r" ON (("j"."recruiter_id" = "r"."recruiter_id")))
  WHERE (("j"."job_id" = "application"."job_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can update own jobs" ON "public"."job" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."recruiter"
  WHERE (("recruiter"."recruiter_id" = "job"."recruiter_id") AND ("recruiter"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can update own profile" ON "public"."recruiter" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Recruiters can update their company" ON "public"."company" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."recruiter"
  WHERE (("recruiter"."company_id" = "company"."company_id") AND ("recruiter"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can view applications to their jobs" ON "public"."application" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."job" "j"
     JOIN "public"."recruiter" "r" ON (("j"."recruiter_id" = "r"."recruiter_id")))
  WHERE (("j"."job_id" = "application"."job_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can view job seeker profiles" ON "public"."job_seeker" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."users"
  WHERE (("users"."id" = "auth"."uid"()) AND ("users"."role" = 'recruiter'::"public"."user_role_enum") AND ("users"."status" = 'active'::"public"."user_status_enum")))));



CREATE POLICY "Recruiters can view own jobs" ON "public"."job" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."recruiter"
  WHERE (("recruiter"."recruiter_id" = "job"."recruiter_id") AND ("recruiter"."user_id" = "auth"."uid"())))));



CREATE POLICY "Recruiters can view own profile" ON "public"."recruiter" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Recruiters can view resumes for applications" ON "public"."resume" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (("public"."application" "app"
     JOIN "public"."job" "j" ON (("app"."job_id" = "j"."job_id")))
     JOIN "public"."recruiter" "r" ON (("j"."recruiter_id" = "r"."recruiter_id")))
  WHERE (("app"."resume_id" = "resume"."resume_id") AND ("r"."user_id" = "auth"."uid"())))));



CREATE POLICY "System can insert notifications" ON "public"."notification" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own record" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own notifications" ON "public"."notification" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own record" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own notifications" ON "public"."notification" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own record" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."application";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."company";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_requirement";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."job_seeker";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."notification";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."recruiter";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."resume";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."users";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."cleanup_incomplete_users"("older_than_days" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_incomplete_users"("older_than_days" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_incomplete_users"("older_than_days" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_user_onboarded"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_onboarded"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_onboarded"("user_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."application" TO "anon";
GRANT ALL ON TABLE "public"."application" TO "authenticated";
GRANT ALL ON TABLE "public"."application" TO "service_role";



GRANT ALL ON SEQUENCE "public"."application_application_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."application_application_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."application_application_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."company" TO "anon";
GRANT ALL ON TABLE "public"."company" TO "authenticated";
GRANT ALL ON TABLE "public"."company" TO "service_role";



GRANT ALL ON SEQUENCE "public"."company_company_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."company_company_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."company_company_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."job" TO "anon";
GRANT ALL ON TABLE "public"."job" TO "authenticated";
GRANT ALL ON TABLE "public"."job" TO "service_role";



GRANT ALL ON SEQUENCE "public"."job_job_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_job_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_job_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."job_requirement" TO "anon";
GRANT ALL ON TABLE "public"."job_requirement" TO "authenticated";
GRANT ALL ON TABLE "public"."job_requirement" TO "service_role";



GRANT ALL ON SEQUENCE "public"."job_requirement_job_requirement_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_requirement_job_requirement_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_requirement_job_requirement_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."job_seeker" TO "anon";
GRANT ALL ON TABLE "public"."job_seeker" TO "authenticated";
GRANT ALL ON TABLE "public"."job_seeker" TO "service_role";



GRANT ALL ON SEQUENCE "public"."job_seeker_job_seeker_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."job_seeker_job_seeker_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."job_seeker_job_seeker_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."notification" TO "anon";
GRANT ALL ON TABLE "public"."notification" TO "authenticated";
GRANT ALL ON TABLE "public"."notification" TO "service_role";



GRANT ALL ON SEQUENCE "public"."notification_notification_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."notification_notification_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."notification_notification_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."recruiter" TO "anon";
GRANT ALL ON TABLE "public"."recruiter" TO "authenticated";
GRANT ALL ON TABLE "public"."recruiter" TO "service_role";



GRANT ALL ON SEQUENCE "public"."recruiter_recruiter_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."recruiter_recruiter_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."recruiter_recruiter_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."resume" TO "anon";
GRANT ALL ON TABLE "public"."resume" TO "authenticated";
GRANT ALL ON TABLE "public"."resume" TO "service_role";



GRANT ALL ON SEQUENCE "public"."resume_resume_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."resume_resume_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."resume_resume_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































RESET ALL;
