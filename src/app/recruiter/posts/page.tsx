"use client";

import { useEffect, useRef, useState } from "react";
import { MoreVertical, Search, Filter, Star, Plus, Pencil, View } from "lucide-react";
import { useRouter } from "next/navigation";
import PostsTableSkeleton from "@/components/recruiter/posts/PostsTableSkeleton";

interface JobPost {
  job_id: string;
  title: string;
  type: string;
  location: string;
  applicants: number;
  views: number;
  date: string;
  status: string;
}

const STATUS_OPTIONS = ["draft", "open", "closed", "deleted"];

export default function RecruiterPostsPage() {
  const [posts, setPosts] = useState<JobPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<JobPost[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["open"]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = (id: string) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch recruiter jobs
  useEffect(() => {
    async function fetchRecruiterJobs() {
      try {
        setLoading(true);
        const query = selectedStatuses.length > 0 ? `?status=${selectedStatuses.join(",")}` : "";
        const res = await fetch(`/api/recruiter/posts${query}`);
        const data = await res.json();
        if (res.ok) {
          const jobs: JobPost[] = data.jobs || [];
          setPosts(jobs);
          setFilteredPosts(jobs);
        } else {
          console.error("Error fetching recruiter posts:", data.error);
        }
      } catch (err) {
        console.error("Fetch recruiter jobs error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecruiterJobs();
  }, [selectedStatuses]);

  // Search filter
  useEffect(() => {
    const term = searchTerm.toLowerCase();

    const searched = posts.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(term);
      const typeMatch = p.type?.toLowerCase().includes(term);
      const locationMatch = p.location?.toLowerCase().includes(term);
      return titleMatch || typeMatch || locationMatch;
    });

    setFilteredPosts(searched);
    setVisibleCount(10); // reset pagination whenever filters change
  }, [searchTerm, posts]);

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
    setVisibleCount(10);
  };

  const handleSeeMore = () => setVisibleCount((prev) => prev + 10);

  const displayedPosts = filteredPosts.slice(0, visibleCount);

  return (
    <div className="max-w-8/10 p-10 justify-center mx-auto my-5 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>

        <button
          className="flex items-center px-4 py-2 border rounded-full font-medium hover:bg-gray-50"
          onClick={() => router.push("/recruiter/posts/create")}
        >
          New Job Post <Plus className="ml-2 w-4 h-4" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search jobs by title, type, or location"
            className="w-full outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
        </div>
      </div>

      {/* Tabs (multi-select filter) */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((status) => {
          const isSelected = selectedStatuses.includes(status);
          const label =
            status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-4 py-2 rounded-full font-medium border transition ${isSelected
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      {loading ? (
        <PostsTableSkeleton />
      ) : displayedPosts.length === 0 ? (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <p className="text-center py-6 text-gray-500">No job posts found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gray-50 text-purple-600 text-left">
              <tr>
                <th className="px-6 py-5 font-semibold">Job Title</th>
                <th className="px-6 py-5 font-semibold">Type</th>
                <th className="px-6 py-5 font-semibold">Location</th>
                <th className="px-6 py-5 font-semibold">Applicants</th>
                {/* <th className="px-6 py-5 font-semibold">Views</th> */}
                <th className="px-6 py-5 font-semibold">Date Posted</th>
                <th className="px-6 py-5 font-semibold">Status</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody>
              {displayedPosts.map((post, i) => (
                <tr
                  key={post.job_id}
                  className={`${i % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-gray-100 transition`}
                >
                  <td className="px-6 py-5 flex items-center gap-2 font-semibold">
                    <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
                    {post.title}
                  </td>
                  <td className="px-6 py-4">{post.type}</td>
                  <td className="px-6 py-4">{post.location}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    {post.applicants}
                    <button
                      className="px-3 py-1 border rounded-full text-xs font-medium hover:bg-gray-100 cursor-pointer"
                      onClick={() =>
                        router.push(`/recruiter/posts/${post.job_id}/applicants`)
                      }
                    >
                      View
                    </button>
                  </td>
                  {/* <td className="px-6 py-4">{post.views}</td> */}
                  <td className="px-6 py-4">{post.date}</td>
                  <td className="px-6 py-4 font-medium">
                    {post.status === "draft" && (
                      <span className="text-gray-600">Draft</span>
                    )}
                    {post.status === "open" && (
                      <span className="text-green-600">Open</span>
                    )}
                    {post.status === "closed" && (
                      <span className="text-yellow-500">Closed</span>
                    )}
                    {post.status === "deleted" && (
                      <span className="text-red-500">Deleted</span>
                    )}
                  </td>
                  <td className="px-6 py-4 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDropdown(post.job_id);
                      }}
                      className="p-1 cursor-pointer"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                    </button>

                    {openDropdown === post.job_id && (
                      <div
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-[80%] w-40 bg-white border border-gray-200 rounded-lg shadow-md z-30 animate-fade"
                      >
                        <button
                          onClick={() =>
                            router.push(`/recruiter/posts/${post.job_id}/edit`)
                          }
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                        >
                          <Pencil size={16} /> Edit Job
                        </button>

                        <button
                          onClick={() =>
                            router.push(`/recruiter/jobs/view/${post.job_id}`)
                          }
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2 cursor-pointer"
                        >
                          <View size={16} /> Preview
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer - See More */}
      {!loading && filteredPosts.length > visibleCount && (
        <div
          className="text-center mt-6 text-sm text-purple-600 font-medium cursor-pointer hover:underline"
          onClick={handleSeeMore}
        >
          See More ↓
        </div>
      )}
    </div>
  );
}
