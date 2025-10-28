import { createClient } from '@/utils/supabase/server';
import { Company } from '@/types';

/**
 * Get a company by ID
 */
export async function getCompanyById(companyId: number): Promise<Company | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .select('*')
        .eq('company_id', companyId)
        .single();

    if (error) {
        console.error('Error fetching company:', error);
        return null;
    }
    return data;
}

/**
 * Get all companies
 */
export async function getAllCompanies(): Promise<Company[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .select('*')
        .order('comp_name', { ascending: true });

    if (error) {
        console.error('Error fetching companies:', error);
        return [];
    }
    return data || [];
}

/**
 * Search companies by name
 */
export async function searchCompaniesByName(searchTerm: string): Promise<Company[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .select('*')
        .ilike('comp_name', `%${searchTerm}%`)
        .order('comp_name', { ascending: true });

    if (error) {
        console.error('Error searching companies:', error);
        return [];
    }
    return data || [];
}

/**
 * Get companies by industry
 */
export async function getCompaniesByIndustry(industry: string): Promise<Company[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .select('*')
        .eq('comp_industry', industry)
        .order('comp_name', { ascending: true });

    if (error) {
        console.error('Error fetching companies by industry:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new company
 */
export async function createCompany(company: {
    comp_name: string;
    comp_industry?: string | null;
    comp_website?: string | null;
}): Promise<Company | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .insert(company)
        .select()
        .single();

    if (error) {
        console.error('Error creating company:', error);
        return null;
    }
    return data;
}

/**
 * Update a company
 */
export async function updateCompany(companyId: number, updates: {
    comp_name?: string;
    comp_industry?: string | null;
    comp_website?: string | null;
}): Promise<Company | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('company')
        .update(updates)
        .eq('company_id', companyId)
        .select()
        .single();

    if (error) {
        console.error('Error updating company:', error);
        return null;
    }
    return data;
}

/**
 * Delete a company
 */
export async function deleteCompany(companyId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('company')
        .delete()
        .eq('company_id', companyId);

    if (error) {
        console.error('Error deleting company:', error);
        return false;
    }
    return true;
}
