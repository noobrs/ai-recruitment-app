import Link from "next/link";
import { getCurrentUser } from "@/services";
import { getUnreadNotifications, getNotificationsByUserId } from "@/services/notification.service";
import HeaderState from "./HeaderState";
import NavLinks from "./NavLinks";

export default async function Header() {
  const user = await getCurrentUser(); // server side
  const role = user?.role;

  // Fetch notification data server-side
  let notificationData = null;
  if (user) {
    const unreadNotifications = await getUnreadNotifications(user.id);
    const allNotifications = await getNotificationsByUserId(user.id);
    notificationData = {
      unreadCount: unreadNotifications.length,
      recentNotifications: allNotifications.slice(0, 5),
    };
  }

  const isRecruiter = role === "recruiter";
  const text = isRecruiter ? "text-secondary" : "text-primary";
  const bg = isRecruiter ? "bg-secondary" : "bg-primary";
  const hoverChip = isRecruiter ? "hover:bg-secondary/10" : "hover:bg-primary/10";
  const underline = isRecruiter ? "bg-secondary" : "bg-primary";

  // role nav config
  const navLinks =
    role === "jobseeker"
      ? [
        { href: "/jobseeker/jobs", label: "Jobs" },
        { href: "/jobseeker/companies", label: "Companies" },
      ]
      : role === "recruiter"
        ? [
          { href: "/recruiter/posts", label: "Posts" },
          { href: "/recruiter/applicants", label: "Applicants" },
          { href: "/recruiter/jobs", label: "Jobs" },
          { href: "/recruiter/companies", label: "Companies" },
        ]
        : [];

  // optional CTA on the right (example)
  const actionLink =
    role === "recruiter"
      ? { href: "/recruiter/posts/new", label: "New Post" }
      : role === "jobseeker"
        ? { href: "/jobseeker/profile", label: "Update Profile" }
        : null;

  const hasNav = user && navLinks.length > 0;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      {/* Row 1 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* App Title */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">
              AI-Powered Recruitment
            </h1>
          </Link>

          {/* Right side */}
          <HeaderState
            user={user ?? null}
            actionLink={actionLink}
            theme={
              { text, bg, hoverChip, underline }
            }
            notificationData={notificationData}
          />
        </div>
      </div>

      {/* Row 2 - Role Navigation */}
      {hasNav && (
        <NavLinks
          navLinks={navLinks}
          underlineClass={underline}
          activeTextClass={text}
        />
      )}
    </header>
  );
}
