import ViewApplicantsAction from "@/components/recruiter/applicants/ApplicantsBrowseActions";
import PostNewJobActions from "@/components/recruiter/posts/PostNewJobActions";
import ManagePostActions from "@/components/recruiter/dashboard/ManagePostActions";
import ManageCompanyActions from "@/components/recruiter/dashboard/ManageCompanyActions";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PostNewJobActions />
        <ViewApplicantsAction />
        <ManagePostActions />
        <ManageCompanyActions />
      </div>
    </div>
  );
}
