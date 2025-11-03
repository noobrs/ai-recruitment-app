"use server";

import { createClient, protectRoute } from "@/utils/supabase/server";
import { getErrorMessage } from "@/utils/utils";

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
