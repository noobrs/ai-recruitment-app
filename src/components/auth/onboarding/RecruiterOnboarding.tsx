'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Loader2, Mail, User, Globe, Briefcase } from 'lucide-react';
import { completeOnboarding } from '@/app/auth/onboarding/actions';
import { uploadProfilePictureAction } from '@/app/actions/profile-picture.actions';
import {
    FILE_SIZE_LIMIT_TEXT,
    ALLOWED_FORMATS_TEXT
} from '@/constants/profile-picture.constants';
import ProfilePictureUpload from '@/components/shared/profile/ProfilePictureUpload';
import CompanyAutocomplete from './CompanyAutocomplete';
import { Company } from '@/types';

interface RecruiterOnboardingProps {
    userId: string;
    email: string;
    defaultFirstName: string;
    defaultLastName: string;
}

export default function RecruiterOnboarding({
    email,
    defaultFirstName,
    defaultLastName,
}: RecruiterOnboardingProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Form fields state
    const [firstName, setFirstName] = useState(defaultFirstName);
    const [lastName, setLastName] = useState(defaultLastName);
    const [position, setPosition] = useState('');

    // Company autocomplete state
    const [companyName, setCompanyName] = useState('');
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

    // Company details state
    const [companyWebsite, setCompanyWebsite] = useState('');
    const [companyIndustry, setCompanyIndustry] = useState('');
    const [companyLocation, setCompanyLocation] = useState('');
    const [companyDescription, setCompanyDescription] = useState('');
    const [companySize, setCompanySize] = useState('');
    const [companyFounded, setCompanyFounded] = useState('');

    // Check if all required fields are filled
    const isFormValid =
        firstName.trim() !== '' &&
        lastName.trim() !== '' &&
        position.trim() !== '' &&
        companyName.trim() !== '';

    const handleProfilePictureChange = (file: File | null, preview: string | null) => {
        setProfilePicture(file);
        setPreviewUrl(preview);
    };

    const handleCompanySelect = (company: Company | null) => {
        setSelectedCompany(company);

        if (company) {
            // Populate fields with existing company data
            setCompanyWebsite(company.comp_website || '');
            setCompanyIndustry(company.comp_industry || '');
            setCompanyLocation(company.comp_location || '');
            setCompanyDescription(company.comp_description || '');
            setCompanySize(company.comp_size || '');
            setCompanyFounded(company.comp_founded ? company.comp_founded.toString() : '');
        } else {
            // Clear fields when no company is selected
            setCompanyWebsite('');
            setCompanyIndustry('');
            setCompanyLocation('');
            setCompanyDescription('');
            setCompanySize('');
            setCompanyFounded('');
        }
    };

    // Get initials from default names
    const initials = `${defaultFirstName.charAt(0)}${defaultLastName.charAt(0)}`.toUpperCase();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);

        // Validate company name
        if (!companyName.trim()) {
            toast.error('Company name is required');
            setIsLoading(false);
            return;
        }

        // Get position value
        const position = formData.get('position') as string;
        if (!position?.trim()) {
            toast.error('Position is required');
            setIsLoading(false);
            return;
        }

        const data = {
            role: 'recruiter' as const,
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            position: position.trim(),
            companyId: selectedCompany?.company_id,
            companyName: companyName.trim(),
            companyWebsite: companyWebsite.trim() || undefined,
            companyIndustry: companyIndustry || undefined,
            companyLocation: companyLocation.trim() || undefined,
            companyDescription: companyDescription.trim() || undefined,
            companySize: companySize || undefined,
            companyFounded: companyFounded ? parseInt(companyFounded, 10) : undefined,
        };

        try {
            // First, upload profile picture if provided
            if (profilePicture) {
                const picFormData = new FormData();
                picFormData.append('file', profilePicture);

                // Use server action instead of API route
                const uploadResult = await uploadProfilePictureAction(picFormData);

                if (uploadResult.error) {
                    throw new Error(uploadResult.error);
                }
            }

            // Complete onboarding
            const result = await completeOnboarding(data);

            if (!result.success) {
                throw new Error(result.error || 'Failed to complete onboarding');
            }

            toast.success('Profile setup complete!');
            router.push('/recruiter/dashboard');
            router.refresh();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div data-role="recruiter">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-neutral-900 mb-2">
                    Complete Your Recruiter Profile
                </h2>
                <p className="text-sm text-neutral-600 flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" />
                    {email}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Profile Picture Upload */}
                <div className="flex flex-col items-center mb-6">
                    <ProfilePictureUpload
                        previewUrl={previewUrl}
                        initials={initials}
                        isEditing={true}
                        isSaving={isLoading}
                        onFileChange={handleProfilePictureChange}
                    />
                    <p className="mt-2 text-xs text-neutral-500 text-center">
                        Optional: Add a profile picture
                        <br />
                        ({FILE_SIZE_LIMIT_TEXT}, {ALLOWED_FORMATS_TEXT})
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            First Name <span className="text-red-500">*</span>
                        </span>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                name="firstName"
                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                disabled={isLoading}
                                placeholder="John"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            Last Name <span className="text-red-500">*</span>
                        </span>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                            <input
                                type="text"
                                name="lastName"
                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                disabled={isLoading}
                                placeholder="Doe"
                                className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                            />
                        </div>
                    </label>
                </div>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Position <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="text"
                            name="position"
                            required
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            disabled={isLoading}
                            placeholder="e.g., HR Manager, Talent Acquisition Specialist"
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Name <span className="text-red-500">*</span>
                    </span>
                    <CompanyAutocomplete
                        value={companyName}
                        onChange={setCompanyName}
                        onCompanySelect={handleCompanySelect}
                        selectedCompany={selectedCompany}
                        disabled={isLoading}
                        required={true}
                    />
                    {!selectedCompany && companyName.trim() && (
                        <p className="mt-1 text-xs text-neutral-500">
                            A new company will be created with this name
                        </p>
                    )}
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Website
                    </span>
                    <div className="relative">
                        <Globe className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                        <input
                            type="url"
                            name="companyWebsite"
                            value={companyWebsite}
                            onChange={(e) => setCompanyWebsite(e.target.value)}
                            disabled={isLoading || !!selectedCompany}
                            placeholder="https://example.com"
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed"
                        />
                    </div>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Industry
                    </span>
                    <select
                        name="companyIndustry"
                        value={companyIndustry}
                        onChange={(e) => setCompanyIndustry(e.target.value)}
                        disabled={isLoading || !!selectedCompany}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed"
                    >
                        <option value="">Select an industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Consulting">Consulting</option>
                        <option value="Other">Other</option>
                    </select>
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Location
                    </span>
                    <input
                        type="text"
                        name="companyLocation"
                        value={companyLocation}
                        onChange={(e) => setCompanyLocation(e.target.value)}
                        disabled={isLoading || !!selectedCompany}
                        placeholder="e.g., San Francisco, CA"
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed"
                    />
                </label>

                <label className="block">
                    <span className="mb-1 block text-sm font-medium text-neutral-700">
                        Company Description
                    </span>
                    <textarea
                        name="companyDescription"
                        value={companyDescription}
                        onChange={(e) => setCompanyDescription(e.target.value)}
                        disabled={isLoading || !!selectedCompany}
                        placeholder="Brief description of the company..."
                        rows={3}
                        className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed resize-none"
                    />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            Company Size
                        </span>
                        <select
                            name="companySize"
                            value={companySize}
                            onChange={(e) => setCompanySize(e.target.value)}
                            disabled={isLoading || !!selectedCompany}
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed"
                        >
                            <option value="">Select size</option>
                            <option value="1-10">1-10 employees</option>
                            <option value="11-50">11-50 employees</option>
                            <option value="51-200">51-200 employees</option>
                            <option value="201-500">201-500 employees</option>
                            <option value="501-1000">501-1000 employees</option>
                            <option value="1001+">1001+ employees</option>
                        </select>
                    </label>

                    <label className="block">
                        <span className="mb-1 block text-sm font-medium text-neutral-700">
                            Year Founded
                        </span>
                        <input
                            type="number"
                            name="companyFounded"
                            value={companyFounded}
                            onChange={(e) => setCompanyFounded(e.target.value)}
                            disabled={isLoading || !!selectedCompany}
                            placeholder="e.g., 2020"
                            min="1800"
                            max={new Date().getFullYear()}
                            className="w-full rounded-lg border border-neutral-200 bg-white/70 px-3 py-2 outline-none focus:ring-2 focus:ring-secondary disabled:bg-neutral-100 disabled:cursor-not-allowed"
                        />
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !isFormValid}
                    className="w-full rounded-lg bg-neutral-900 text-white py-3 font-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-70 disabled:cursor-not-allowed transition-opacity"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Setting up your profile...
                        </>
                    ) : (
                        'Complete Setup'
                    )}
                </button>
            </form>
        </div>
    );
}
