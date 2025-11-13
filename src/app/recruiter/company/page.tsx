"use client";

import { useState, useEffect } from "react";
import ProfileEditActions from "@/components/recruiter/profile/ProfileEditActions";

export default function RecruiterCompanyPage() {
    const [company, setCompany] = useState<any>(null);
    const [formData, setFormData] = useState({
        comp_name: "",
        comp_industry: "",
        comp_website: "",
    });

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch company
    useEffect(() => {
        async function fetchCompany() {
            try {
                const res = await fetch("/api/recruiter/company");

                const data = await res.json();
                if (!res.ok) throw new Error(data.error);

                setCompany(data.company);
                setFormData({
                    comp_name: data.company.comp_name || "",
                    comp_industry: data.company.comp_industry || "",
                    comp_website: data.company.comp_website || "",
                });
            } catch (err) {
                console.error("Fetch error:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCompany();
    }, []);

    // Change handler
    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // Save
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch("/api/recruiter/company", {
                method: "PATCH",
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCompany(data.company);
            setIsEditing(false);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Cancel
    const handleCancel = () => {
        setFormData({
            comp_name: company.comp_name,
            comp_industry: company.comp_industry,
            comp_website: company.comp_website,
        });
        setIsEditing(false);
    };

    if (loading)
        return (
            <div className="flex items-center justify-center h-screen text-gray-600">
                Loading company profile...
            </div>
        );

    return (
        <div className="max-w-5xl mx-auto p-10 bg-white shadow-md rounded-xl border border-gray-200 my-10">

            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Company Profile</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your company’s public information
                    </p>
                </div>

                <ProfileEditActions
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onEdit={() => setIsEditing(true)}
                    onCancel={handleCancel}
                    onSave={handleSave}
                />
            </div>

            {/* Company Info Card */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">

                {/* Company Name */}
                <div className="mb-6">
                    <label className="text-sm text-gray-500">Company Name</label>
                    {!isEditing ? (
                        <p className="text-lg font-semibold mt-1">{company.comp_name}</p>
                    ) : (
                        <input
                            type="text"
                            value={formData.comp_name}
                            onChange={(e) => handleChange("comp_name", e.target.value)}
                            className="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                        />
                    )}
                </div>

                {/* Industry */}
                <div className="mb-6">
                    <label className="text-sm text-gray-500">Industry</label>
                    {!isEditing ? (
                        <p className="text-gray-700 mt-1">
                            {company.comp_industry || "Not specified"}
                        </p>
                    ) : (
                        <input
                            type="text"
                            value={formData.comp_industry}
                            onChange={(e) => handleChange("comp_industry", e.target.value)}
                            className="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                        />
                    )}
                </div>

                {/* Website */}
                <div className="mb-6">
                    <label className="text-sm text-gray-500">Company Website</label>
                    {!isEditing ? (
                        <a
                            href={company.comp_website}
                            target="_blank"
                            className="text-blue-600 underline mt-1 block"
                        >
                            {company.comp_website || "Not provided"}
                        </a>
                    ) : (
                        <input
                            type="text"
                            value={formData.comp_website}
                            onChange={(e) => handleChange("comp_website", e.target.value)}
                            className="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                            placeholder="https://example.com"
                        />
                    )}
                </div>

                {/* Company Logo Placeholder */}
                <div className="mb-6">
                    <label className="text-sm text-gray-500">Company Logo</label>

                    <div className="mt-2 w-24 h-24 bg-white border rounded-lg flex items-center justify-center text-gray-500 text-sm">
                        <img
                            src={company.comp_logo_path || "/default-company.png"}
                            alt="Company Logo"
                            className="w-24 h-24 object-contain rounded-lg"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
