import ViewApplicantsAction from "@/components/recruiter/applicants/ApplicantsBrowseActions";
import PostNewJobActions from "@/components/recruiter/posts/PostNewJobActions";

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Quick Actions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <PostNewJobActions />
        <ViewApplicantsAction />

        <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
          <span className="text-sm font-medium">Manage Jobs</span>
        </button>

        <button className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-indigo-500 hover:text-indigo-600 transition-colors">
          <span className="text-sm font-medium">Search Candidates</span>
        </button>
      </div>
    </div>
  );
}
