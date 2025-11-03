import type { UserRole } from "@/types";

export const getErrorMessage = (
    error: unknown,
    defaultMessage: string = "Something went wrong"
) => {
    console.error(error);
    let errorMessage = defaultMessage;
    if (error instanceof Error && error.message.length < 100) {
        errorMessage = error.message;
    }
    return errorMessage;
};

export function isValidRole(r: string | null | undefined): r is UserRole {
    return r === "jobseeker" || r === "recruiter";
}
export function roleLabel(role: UserRole) {
    return role === "jobseeker" ? "Job Seeker" : "Recruiter";
}
