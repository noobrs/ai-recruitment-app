"use client";

import { useState } from "react";
import { MoreVertical, Search, Filter, ChevronDown, Star } from "lucide-react";

export default function RecruiterPostsPage() {
  const [selectedTab, setSelectedTab] = useState("Marked");

  const posts = [
    {
      title: "UX/UI Designer",
      type: "Remote",
      location: "Karlsruhe, Germany",
      applicants: 17,
      views: 901,
      date: "06/Jul/2024",
      status: "Closed",
    },
    {
      title: "Producer Designer",
      type: "Hybrid",
      location: "Torino, Italy",
      applicants: 26,
      views: 901,
      date: "06/Jul/2024",
      status: "Closed",
    },
    {
      title: "Product Designer",
      type: "On Site",
      location: "Delft, Netherloands",
      applicants: 10,
      views: 203,
      date: "09/Jul/2024",
      status: "Open",
    },
    {
      title: "UX/UI Designer",
      type: "Hybrid",
      location: "Berlin, Germany",
      applicants: 15,
      views: 901,
      date: "06/Jul/2024",
      status: "Paused",
    },
    {
      title: "Developer",
      type: "Hybrid",
      location: "Bonn, Germany",
      applicants: 25,
      views: 856,
      date: "05/Jul/2024",
      status: "Closed",
    },
    {
      title: "UX/UI Designer",
      type: "Remote",
      location: "Porto, Portugal",
      applicants: 23,
      views: 368,
      date: "06/Jul/2024",
      status: "Closed",
    },
    {
      title: "Developer",
      type: "Hybrid",
      location: "Bonn, Germany",
      applicants: 25,
      views: 856,
      date: "05/Jul/2024",
      status: "Closed",
    },
  ];

  return (
    <div className="max-w-8/10 p-10 justify-center mx-auto my-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Posts</h1>

        {/* Applicants Dropdown */}
        <button className="flex items-center px-4 py-2 border rounded-full font-medium hover:bg-gray-50">
          Applicants <ChevronDown className="ml-2 w-4 h-4" />
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center w-full border rounded-full px-4 py-3 bg-white shadow-sm">
          <Search className="w-5 h-5 text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search and Filter"
            className="w-full outline-none text-gray-700 placeholder-gray-400"
          />
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setSelectedTab("Marked")}
          className={`px-4 py-2 rounded-full font-medium ${
            selectedTab === "Marked"
              ? "bg-purple-600 text-white"
              : "bg-white border text-gray-700"
          }`}
        >
          Marked
        </button>
        <button
          onClick={() => setSelectedTab("Open And Paused")}
          className={`px-4 py-2 rounded-full font-medium ${
            selectedTab === "Open And Paused"
              ? "bg-purple-600 text-white"
              : "bg-white border text-gray-700"
          }`}
        >
          Open And Paused
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-purple-600 text-left">
            <tr>
              <th className="px-6 py-3 font-semibold">Job Title</th>
              <th className="px-6 py-3 font-semibold">Type</th>
              <th className="px-6 py-3 font-semibold">Location</th>
              <th className="px-6 py-3 font-semibold">Applicants</th>
              <th className="px-6 py-3 font-semibold">Views</th>
              <th className="px-6 py-3 font-semibold">Date Posted</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post, i) => (
              <tr
                key={i}
                className={` ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-6 py-4 flex items-center gap-2 font-semibold">
                  <Star className="w-4 h-4 text-purple-600 fill-purple-600" />
                  {post.title}
                </td>
                <td className="px-6 py-4">{post.type}</td>
                <td className="px-6 py-4">{post.location}</td>
                <td className="px-6 py-4 flex items-center gap-2">
                  {post.applicants}
                  <button className="px-3 py-1 border rounded-full text-xs font-medium hover:bg-gray-100">
                    View
                  </button>
                </td>
                <td className="px-6 py-4">{post.views}</td>
                <td className="px-6 py-4">{post.date}</td>
                <td className="px-6 py-4 font-medium">
                  {post.status === "Open" && (
                    <span className="text-green-600">Open</span>
                  )}
                  {post.status === "Closed" && (
                    <span className="text-gray-500">Closed</span>
                  )}
                  {post.status === "Paused" && (
                    <span className="text-yellow-500">Paused</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <MoreVertical className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="text-center mt-6 text-sm text-purple-600 font-medium cursor-pointer hover:underline">
        See More ↓
      </div>
    </div>
  );
}
