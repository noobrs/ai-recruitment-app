"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { BUCKET_NAME, validateProfilePicture } from "@/constants/profile-picture.constants";

interface UploadResult {
    success?: boolean;
    profilePictureUrl?: string;
    error?: string;
}

interface DeleteResult {
    success?: boolean;
    error?: string;
}

/**
 * Upload Profile Picture Server Action
 * 
 * Uploads a profile picture to Supabase Storage using admin client and updates the user's profile.
 * - Validates file type and size
 * - Deletes old profile picture if exists
 * - Uploads new picture to 'profile-pictures' bucket
 * - Updates user record with public URL
 */
export async function uploadProfilePictureAction(formData: FormData): Promise<UploadResult> {
    try {
        // Get authenticated user using regular client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { error: 'Unauthorized' };
        }

        // Parse form data
        const file = formData.get('file') as File;

        if (!file) {
            return { error: 'No file provided' };
        }

        // Validate file using centralized validation
        const validationError = validateProfilePicture(file);
        if (validationError) {
            return { error: validationError };
        }

        // Use admin client for storage and database operations
        const supabaseAdmin = createAdminClient();

        // Get current user data to check for existing profile picture
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('profile_picture_path')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return { error: 'Failed to fetch user data' };
        }

        // Delete old profile picture if exists
        if (userData?.profile_picture_path) {
            try {
                // Extract the file path from the full URL or path
                const oldPath = userData.profile_picture_path.includes(BUCKET_NAME)
                    ? userData.profile_picture_path.split(`${BUCKET_NAME}/`)[1]
                    : userData.profile_picture_path;

                if (oldPath) {
                    const { error: deleteError } = await supabaseAdmin.storage
                        .from(BUCKET_NAME)
                        .remove([oldPath]);

                    if (deleteError) {
                        console.error('Error deleting old profile picture:', deleteError);
                        // Continue with upload even if delete fails
                    }
                }
            } catch (err) {
                console.error('Error processing old profile picture deletion:', err);
                // Continue with upload even if delete fails
            }
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const timestamp = Date.now();
        const fileName = `${user.id}/${timestamp}.${fileExt}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to Supabase Storage using admin client
        const { error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false,
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            return { error: 'Failed to upload file to storage' };
        }

        // Get public URL
        const { data: publicUrlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        const publicUrl = publicUrlData.publicUrl;

        // Update user record with new profile picture URL
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                profile_picture_path: publicUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating user record:', updateError);

            // Try to clean up uploaded file since DB update failed
            await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove([fileName]);

            return { error: 'Failed to update user profile' };
        }

        // Revalidate paths to reflect changes
        revalidatePath('/jobseeker/profile');
        revalidatePath('/recruiter/profile');
        revalidatePath('/jobseeker/dashboard');
        revalidatePath('/recruiter/dashboard');

        return {
            success: true,
            profilePictureUrl: publicUrl,
        };

    } catch (error) {
        console.error('Unexpected error in profile picture upload:', error);
        return { error: 'Internal server error' };
    }
}

/**
 * Delete Profile Picture Server Action
 * 
 * Deletes the user's profile picture from Supabase Storage using admin client and updates the database.
 */
export async function deleteProfilePictureAction(): Promise<DeleteResult> {
    try {
        // Get authenticated user using regular client
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            return { error: 'Unauthorized' };
        }

        // Use admin client for storage and database operations
        const supabaseAdmin = createAdminClient();

        // Get current user data to get profile picture path
        const { data: userData, error: userError } = await supabaseAdmin
            .from('users')
            .select('profile_picture_path')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error fetching user data:', userError);
            return { error: 'Failed to fetch user data' };
        }

        if (!userData?.profile_picture_path) {
            return { error: 'No profile picture to delete' };
        }

        // Extract the file path from the full URL or path
        const filePath = userData.profile_picture_path.includes(BUCKET_NAME)
            ? userData.profile_picture_path.split(`${BUCKET_NAME}/`)[1]
            : userData.profile_picture_path;

        // Delete from storage using admin client
        if (filePath) {
            const { error: deleteError } = await supabaseAdmin.storage
                .from(BUCKET_NAME)
                .remove([filePath]);

            if (deleteError) {
                console.error('Error deleting profile picture from storage:', deleteError);
                // Continue to update database even if storage delete fails
            }
        }

        // Update user record to remove profile picture
        const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
                profile_picture_path: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('Error updating user record:', updateError);
            return { error: 'Failed to update user profile' };
        }

        // Revalidate paths to reflect changes
        revalidatePath('/jobseeker/profile');
        revalidatePath('/recruiter/profile');
        revalidatePath('/jobseeker/dashboard');
        revalidatePath('/recruiter/dashboard');

        return {
            success: true,
        };

    } catch (error) {
        console.error('Unexpected error in profile picture deletion:', error);
        return { error: 'Internal server error' };
    }
}
