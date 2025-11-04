import { Job } from "@/types/job";
import { Branch } from "@/types/branch";

// Example branch (you can expand as needed)
const exampleBranch: Branch = {
  branchId: 1,
  companyId: {
    companyId: 1,
    compName: "TechNova",
    compLogo: "/public/file.svg",
    compOverview: "Innovative tech company.",
    compSector: "Technology",
    compIndustry: "Software",
    compWebsite: "https://technova.com",
    compSize: 500,
    compFounded: 2010,
    compRevenue: 10000000,
    createdAt: "2010-01-01"
  },
  branchName: "San Francisco HQ",
  branchAddress: "123 Market St, San Francisco, CA, USA",
  branchPhone: "+1 415-555-1234",
  branchEmail: "sf@technova.com",
  branchWebsite: "https://technova.com/sf",
  branchLogo: "/public/file.svg",
  branchStatus: "Active",
  createdAt: "2010-01-01"
};

export const mockJobs: Job[] = [
  {
    jobId: 1,
    branchId: exampleBranch,
    jobTitle: "Frontend Developer",
    jobDescription: "Develop and maintain user interfaces.",
    jobLocation: "San Francisco, USA",
    jobBenefits: "Health insurance, Remote work, Stock options",
    jobType: "Full-time",
    jobIndustry: "Software",
    salaryRange: "$90,000 - $120,000",
    jobStatus: "Open",
    createdAt: "2024-06-01"
  },
  {
    jobId: 2,
    branchId: exampleBranch,
    jobTitle: "Backend Engineer",
    jobDescription: "Build and optimize server-side applications.",
    jobLocation: "London, UK",
    jobBenefits: "Flexible hours, Pension plan",
    jobType: "Part-time",
    jobIndustry: "Software",
    salaryRange: "£40,000 - £60,000",
    jobStatus: "Open",
    createdAt: "2024-05-28"
  },
  {
    jobId: 3,
    branchId: exampleBranch,
    jobTitle: "Data Scientist",
    jobDescription: "Analyze data and build predictive models.",
    jobLocation: "Toronto, Canada",
    jobBenefits: "Remote work, Health insurance",
    jobType: "Remote",
    jobIndustry: "Analytics",
    salaryRange: "CA$80,000 - CA$110,000",
    jobStatus: "Open",
    createdAt: "2024-05-20"
  },
  {
    jobId: 4,
    branchId: exampleBranch,
    jobTitle: "DevOps Engineer",
    jobDescription: "Automate and manage cloud infrastructure.",
    jobLocation: "Berlin, Germany",
    jobBenefits: "Gym membership, Health insurance",
    jobType: "Full-time",
    jobIndustry: "Cloud",
    salaryRange: "€60,000 - €85,000",
    jobStatus: "Open",
    createdAt: "2024-05-15"
  },
  {
    jobId: 5,
    branchId: exampleBranch,
    jobTitle: "Project Manager",
    jobDescription: "Lead software development projects.",
    jobLocation: "Sydney, Australia",
    jobBenefits: "Annual bonus, Paid leave",
    jobType: "Contract",
    jobIndustry: "Management",
    salaryRange: "AU$100,000 - AU$130,000",
    jobStatus: "Open",
    createdAt: "2024-05-10"
  },
  {
    jobId: 6,
    branchId: exampleBranch,
    jobTitle: "UI/UX Designer",
    jobDescription: "Design user-friendly interfaces.",
    jobLocation: "Paris, France",
    jobBenefits: "Remote work, Flexible hours",
    jobType: "Full-time",
    jobIndustry: "Design",
    salaryRange: "€45,000 - €65,000",
    jobStatus: "Open",
    createdAt: "2024-05-05"
  },
  {
    jobId: 7,
    branchId: exampleBranch,
    jobTitle: "QA Tester",
    jobDescription: "Test and ensure software quality.",
    jobLocation: "Detroit, USA",
    jobBenefits: "Health insurance, Paid leave",
    jobType: "Internship",
    jobIndustry: "Quality Assurance",
    salaryRange: "$30,000 - $40,000",
    jobStatus: "Open",
    createdAt: "2024-05-01"
  },
  {
    jobId: 8,
    branchId: exampleBranch,
    jobTitle: "Mobile Developer",
    jobDescription: "Develop mobile applications.",
    jobLocation: "Dublin, Ireland",
    jobBenefits: "Remote work, Health insurance",
    jobType: "Full-time",
    jobIndustry: "Mobile",
    salaryRange: "€50,000 - €70,000",
    jobStatus: "Open",
    createdAt: "2024-04-28"
  },
  {
    jobId: 9,
    branchId: exampleBranch,
    jobTitle: "AI Engineer",
    jobDescription: "Build AI-powered solutions.",
    jobLocation: "Delhi, India",
    jobBenefits: "Flexible hours, Health insurance",
    jobType: "Remote",
    jobIndustry: "Artificial Intelligence",
    salaryRange: "₹1,200,000 - ₹1,800,000",
    jobStatus: "Open",
    createdAt: "2024-04-20"
  },
  {
    jobId: 10,
    branchId: exampleBranch,
    jobTitle: "Full Stack Developer",
    jobDescription: "Work on both frontend and backend.",
    jobLocation: "Singapore",
    jobBenefits: "Annual bonus, Paid leave",
    jobType: "Full-time",
    jobIndustry: "Software",
    salaryRange: "SGD 70,000 - SGD 100,000",
    jobStatus: "Open",
    createdAt: "2024-04-15"
  }
];