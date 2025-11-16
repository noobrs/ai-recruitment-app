"use server";

import { createClient } from "@/utils/supabase/server";
import { TablesUpdate } from "@/types/database.types";

export async function getCompanyForRecruiter() {
  const supabase = await createClient();

  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", company: null };

  // Find recruiter's company
  const { data: recruiter } = await supabase
    .from("recruiter")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!recruiter) return { error: "Recruiter not found", company: null };

  const { data: company } = await supabase
    .from("company")
    .select("*")
    .eq("company_id", recruiter.company_id)
    .single();

  return { company };
}

export async function updateCompany(formData: any) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", company: null };

  const { data: recruiter } = await supabase
    .from("recruiter")
    .select("company_id")
    .eq("user_id", user.id)
    .single();

  if (!recruiter) return { error: "Recruiter not found", company: null };

  // Typesafe update payload
  const updates: TablesUpdate<"company"> = {
    comp_name: formData.comp_name,
    comp_industry: formData.comp_industry,
    comp_website: formData.comp_website,
    comp_description: formData.comp_description,
    comp_location: formData.comp_location,
    comp_size: formData.comp_size,
    comp_founded: Number(formData.comp_founded),
  };

  const { data: company, error } = await supabase
    .from("company")
    .update(updates)
    .eq("company_id", recruiter.company_id)
    .select()
    .single();

  if (error) return { error: error.message, company: null };
  return { company };
}
