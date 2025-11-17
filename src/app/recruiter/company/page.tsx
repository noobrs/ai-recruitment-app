"use client";

import { useState, useEffect } from "react";
import CompanyProfileActions from "@/components/recruiter/company/CompanyProfileActions";
import { getCompanyForRecruiter, updateCompany } from "./actions";

export default function RecruiterCompanyPage() {
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [formData, setFormData] = useState({
        comp_name: "",
        comp_industry: "",
        comp_website: "",
        comp_description: "",
        comp_location: "",
        comp_size: "",
        comp_founded: "",
    });

    // Load company
    useEffect(() => {
        async function load() {
            const res = await getCompanyForRecruiter();
            if (!res.company) return;
            setCompany(res.company);
            setFormData({
                comp_name: res.company.comp_name || "",
                comp_industry: res.company.comp_industry || "",
                comp_website: res.company.comp_website || "",
                comp_description: res.company.comp_description || "",
                comp_location: res.company.comp_location || "",
                comp_size: res.company.comp_size || "",
                comp_founded: res.company.comp_founded?.toString() || "",
            });
            setLoading(false);
        }
        load();
    }, []);

    const save = async () => {
        setIsSaving(true);
        const result = await updateCompany(formData);
        if (!result.error) {
            setCompany(result.company);
            setIsEditing(false);
        }
        setIsSaving(false);
    };

    const cancel = () => {
        setFormData({
            comp_name: company.comp_name,
            comp_industry: company.comp_industry,
            comp_website: company.comp_website,
            comp_description: company.comp_description,
            comp_location: company.comp_location,
            comp_size: company.comp_size,
            comp_founded: company.comp_founded,
        });
        setIsEditing(false);
    };

    if (loading)
        return <div className="flex items-center justify-center p-20 text-gray-600 min-h-screen">Loading company…</div>;

    return (
        <div className="max-w-5xl mx-auto p-10 bg-white shadow-md rounded-xl border border-gray-200 my-10 min-h-screen">

            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Company Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your company details</p>
                </div>
                <CompanyProfileActions
                    isEditing={isEditing}
                    isSaving={isSaving}
                    onEdit={() => setIsEditing(true)}
                    onCancel={cancel}
                    onSave={save}
                />
            </div>

            {/* Main Company Card */}
            <div className="bg-gray-50 px-8 py-6 rounded-xl border border-gray-200">

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

                {/* Company Name */}
                <Field label="Company Name" editing={isEditing} value={formData.comp_name}
                    onChange={(v) => setFormData({ ...formData, comp_name: v })}
                />

                {/* Industry */}
                <Field label="Industry" editing={isEditing} value={formData.comp_industry}
                    onChange={(v) => setFormData({ ...formData, comp_industry: v })}
                />

                {/* Website */}
                <div className="mb-6">
                    <label className="text-sm text-gray-500">Website</label>
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
                            onChange={(v) => setFormData({ ...formData, comp_website: v.target.value })}
                            className="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                            placeholder="https://example.com"
                        />
                    )}
                </div>

                {/* Description */}
                <Field
                    label="About Company"
                    value={formData.comp_description}
                    editing={isEditing}
                    textarea
                    large
                    onChange={(v) => setFormData({ ...formData, comp_description: v })}
                />

                {/* Location */}
                <Field label="Headquarters Location" editing={isEditing}
                    value={formData.comp_location}
                    onChange={(v) => setFormData({ ...formData, comp_location: v })}
                />

                {/* Size */}
                <Field label="Company Size" editing={isEditing} value={formData.comp_size}
                    onChange={(v) => setFormData({ ...formData, comp_size: v })}
                />

                {/* Founded Year */}
                <Field label="Founded Year" editing={isEditing} type="number"
                    value={formData.comp_founded}
                    onChange={(v) => setFormData({ ...formData, comp_founded: v })}
                />

            </div>
        </div>
    );
}

interface FieldProps {
    label: string;
    value: string | number | null;
    onChange: (value: string) => void;
    editing: boolean;
    textarea?: boolean;
    type?: string;
    large?: boolean; // NEW → for bigger textarea
}

function Field({
    label,
    value,
    onChange,
    editing,
    textarea = false,
    type = "text",
    large = false,
}: FieldProps) {
    return (
        <div className="mb-6">
            <label className="text-sm text-gray-500">{label}</label>

            {/* DISPLAY MODE */}
            {!editing ? (
                <p className="mt-1 text-gray-700 whitespace-pre-line text-justify">
                    {value || "Not provided"}
                </p>
            ) : textarea ? (
                /* TEXTAREA (EDIT MODE) */
                <textarea
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    className={`mt-2 w-full px-4 py-3 border rounded-md focus:ring-2 focus:ring-primary ${large ? "h-40" : "h-24"
                        }`}
                />
            ) : (
                /* NORMAL INPUT (EDIT MODE) */
                <input
                    type={type}
                    value={value ?? ""}
                    onChange={(e) => onChange(e.target.value)}
                    className="mt-2 w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                />
            )}
        </div>
    );
}
