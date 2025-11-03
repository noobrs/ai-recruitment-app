"use server";

import { createClient, protectRoute } from "@/utils/supabase/server";
import type { UserRole } from "@/types";
import { getErrorMessage } from "@/utils/utils";

export const googleSignInAction = async (role: UserRole) => {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?role=${role}`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.url) {
        // Return URL for client-side redirect instead of server redirect
        return { url: data.url };
    }

    return { error: 'Failed to initiate Google sign in' };
};


// export const createAccountAction = async (formData: FormData) => {
//     try {
//         const email = formData.get("email") as string;
//         const password = formData.get("password") as string;

//         const { auth } = await createClient();

//         const { error } = await auth.signUp({
//             email,
//             password,
//         });

//         if (error) throw error;

//         return { errorMessage: null };
//     } catch (error) {
//         return { errorMessage: getErrorMessage(error) };
//     }
// };

export async function registerAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");
    const name = String(formData.get("name") ?? "");
    const role = String(formData.get("role") ?? "jobseeker") as UserRole;

    if (password !== confirmPassword) {
        return { errorMessage: "Passwords do not match" };
    }

    const supabase = await createClient();

    // Register user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                role,
            },
        },
    });

    if (error) {
        return { errorMessage: error.message };
    }

    // Optionally insert into public.user table
    // await supabase.from("user").insert({ id: data.user.id, name, role });

    return { errorMessage: null };
}


export async function loginAction(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "jobseeker") as UserRole;

    const supabase = await createClient();

    // Your existing auth flow here:
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { errorMessage: error.message };
    }

    // Optional: role-aware post-login routing can be done on client or here by returning a URL
    return { errorMessage: null };
}

// export const loginAction = async (formData: FormData) => {
//     try {
//         const email = formData.get("email") as string;
//         const password = formData.get("password") as string;

//         const { auth } = await createClient();

//         const { error } = await auth.signInWithPassword({
//             email,
//             password,
//         });

//         if (error) throw error;

//         return { errorMessage: null };
//     } catch (error) {
//         return { errorMessage: getErrorMessage(error) };
//     }
// };

export const signOutAction = async () => {
    try {
        await protectRoute();

        const { auth } = await createClient();

        const { error } = await auth.signOut();

        if (error) throw error;

        return { errorMessage: null };
    } catch (error) {
        return { errorMessage: getErrorMessage(error) };
    }
};
