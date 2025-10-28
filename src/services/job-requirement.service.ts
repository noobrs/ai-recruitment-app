import { createClient } from '@/utils/supabase/server';
import { JobRequirement } from '@/types';

/**
 * Get a job requirement by ID
 */
export async function getJobRequirementById(requirementId: number): Promise<JobRequirement | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .select('*')
        .eq('job_requirement_id', requirementId)
        .single();

    if (error) {
        console.error('Error fetching job requirement:', error);
        return null;
    }
    return data;
}

/**
 * Get all requirements for a job
 */
export async function getRequirementsByJobId(jobId: number): Promise<JobRequirement[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .select('*')
        .eq('job_id', jobId)
        .order('weightage', { ascending: false });

    if (error) {
        console.error('Error fetching job requirements:', error);
        return [];
    }
    return data || [];
}

/**
 * Get requirements by type
 */
export async function getRequirementsByType(jobId: number, type: string): Promise<JobRequirement[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .select('*')
        .eq('job_id', jobId)
        .eq('type', type)
        .order('weightage', { ascending: false });

    if (error) {
        console.error('Error fetching requirements by type:', error);
        return [];
    }
    return data || [];
}

/**
 * Create a new job requirement
 */
export async function createJobRequirement(requirement: {
    job_id: number;
    requirement: string;
    type?: string | null;
    normalized_requirement?: string | null;
    weightage?: number | null;
}): Promise<JobRequirement | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .insert(requirement)
        .select()
        .single();

    if (error) {
        console.error('Error creating job requirement:', error);
        return null;
    }
    return data;
}

/**
 * Create multiple job requirements
 */
export async function createMultipleRequirements(requirements: Array<{
    job_id: number;
    requirement: string;
    type?: string | null;
    normalized_requirement?: string | null;
    weightage?: number | null;
}>): Promise<JobRequirement[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .insert(requirements)
        .select();

    if (error) {
        console.error('Error creating multiple requirements:', error);
        return [];
    }
    return data || [];
}

/**
 * Update a job requirement
 */
export async function updateJobRequirement(requirementId: number, updates: {
    requirement?: string;
    type?: string | null;
    normalized_requirement?: string | null;
    weightage?: number | null;
}): Promise<JobRequirement | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('job_requirement')
        .update(updates)
        .eq('job_requirement_id', requirementId)
        .select()
        .single();

    if (error) {
        console.error('Error updating job requirement:', error);
        return null;
    }
    return data;
}

/**
 * Delete a job requirement
 */
export async function deleteJobRequirement(requirementId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_requirement')
        .delete()
        .eq('job_requirement_id', requirementId);

    if (error) {
        console.error('Error deleting job requirement:', error);
        return false;
    }
    return true;
}

/**
 * Delete all requirements for a job
 */
export async function deleteAllJobRequirements(jobId: number): Promise<boolean> {
    const supabase = await createClient();
    const { error } = await supabase
        .from('job_requirement')
        .delete()
        .eq('job_id', jobId);

    if (error) {
        console.error('Error deleting all job requirements:', error);
        return false;
    }
    return true;
}
