"use client";

import { useState } from "react";
import { Search, Filter, ChevronDown } from "lucide-react";

export default function RecruiterApplicantsPage() {
  const [selectedTab, setSelectedTab] = useState("Waiting");

  const applicants = [
    {
      name: "Jane Smith",
      jobTitle: "Product Designer",
      date: "06/Dec/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      name: "Smith Joe",
      jobTitle: "Ux Researcher",
      date: "07/Jun/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      name: "Jay Ruhe",
      jobTitle: "Product Designer",
      date: "06/Dec/2023",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/women/3.jpg",
    },
    {
      name: "Benjamin Kalt",
      jobTitle: "UI/UX Designer",
      date: "08/Mar/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/men/4.jpg",
    },
    {
      name: "Elena Streep",
      jobTitle: "Product Designer",
      date: "08/Apr/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/women/5.jpg",
    },
    {
      name: "Julian Mark",
      jobTitle: "Product Designer",
      date: "06/Mar/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/men/6.jpg",
    },
    {
      name: "Nicole Kidman",
      jobTitle: "Product Designer",
      date: "05/Jul/2024",
      status: "In Review",
      image: "https://randomuser.me/api/portraits/women/7.jpg",
    },
  ];

  return (
    <div className="max-w-8/10 p-10 justify-center mx-auto my-5">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Applicants</h1>

        <button className="flex items-center px-5 py-2 border rounded-full font-medium hover:bg-gray-50 transition">
          Suggested Applicants
        </button>
      </div>

      {/* Search & Filter */}
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
        {["Approved", "Waiting", "Rejected"].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 rounded-full font-medium ${
              selectedTab === tab
                ? "bg-purple-600 text-white"
                : "bg-white border text-gray-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-sm">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-50 text-purple-600 text-left">
            <tr>
              <th className="px-6 py-5 font-semibold">Applicant Name</th>
              <th className="px-6 py-5 font-semibold">Job Title</th>
              <th className="px-6 py-5 font-semibold">Application Date</th>
              <th className="px-6 py-5 font-semibold">Status</th>
              <th className="px-6 py-5"></th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((a, i) => (
              <tr
                key={i}
                className={`${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-gray-100 transition`}
              >
                <td className="px-6 py-4 flex items-center gap-3 font-semibold capitalize">
                  <img
                    src={a.image}
                    alt={a.name}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  {a.name}
                </td>
                <td className="px-6 py-4">{a.jobTitle}</td>
                <td className="px-6 py-4">{a.date}</td>
                <td className="px-6 py-4 flex items-center gap-1 font-medium text-gray-700">
                  {a.status}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </td>
                <td className="px-6 py-4 text-purple-600 font-medium cursor-pointer hover:underline">
                  View Details
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
