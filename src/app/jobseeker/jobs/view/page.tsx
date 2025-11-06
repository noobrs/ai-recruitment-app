// import { mockJobCards } from "@/mock_data/mockJobCard";
// import { mockJobs } from "@/mock_data/mockJobs";

// export default function Job() {
//     return (
//         <>
//             <div className="mx-50 my-5 rounded-lg shadow-md border-gray-300 border-1 p-5">
//                 {/* Job Details */}
//                 <div className="w-full h-full">
//                     <div className="flex flex-row items-center pb-3">
//                         <img src={mockJobCards[0].compLogo} alt="Company Logo" className="w-10 h-10 mr-2" />
//                         <p className="text-lg text-gray-600 grow-1">{mockJobCards[0].compName}</p>
//                         <img src={mockJobCards[0].bookmark ? "/bookmark-solid.svg" : "/bookmark.svg"} alt="Bookmark" className="w-7 h-7"></img>
//                         <a href="/job"><img src="/expand.svg" alt="Expand" className="w-7 h-7"></img></a>
//                     </div>

//                     <div className="flex flex-col">
//                         <p className="text-3xl font-bold text-gray-600 pb-2">{mockJobCards[0].jobTitle}</p>
//                         <p className="text-lg text-gray-600 pb-2">{mockJobCards[0].jobLocation} ({mockJobCards[0].jobType})</p>
//                         <p className="text-lg text-gray-600 pb-2">Posted on {mockJobCards[0].createdAt}</p>
//                     </div>

//                     {/* Tabs */}
//                     <div className="text-center font-bold text-gray-500 border-b border-gray-400">
//                         <ul className="flex flex-wrap -mb-px">
//                             <li className="me-8">
//                                 <a href="#job-description" className="inline-block p-3 border-b-2 border-transparent hover:border-gray-600 hover:text-gray-600 rounded-t-lg">Job Description</a>
//                             </li>
//                             <li className="me-8">
//                                 <a href="#requirements" className="inline-block p-3 border-b-2 border-transparent hover:border-gray-600 hover:text-gray-600 rounded-t-lg">Requirements</a>
//                             </li>
//                             <li className="me-8">
//                                 <a href="#benefits" className="inline-block p-3 border-b-2 border-transparent hover:border-gray-600 hover:text-gray-600 rounded-t-lg">Benefits</a>
//                             </li>
//                             <li className="me-8">
//                                 <a href="#overview" className="inline-block p-3 border-b-2 border-transparent hover:border-gray-600 hover:text-gray-600 rounded-t-lg">Overview</a>
//                             </li>
//                         </ul>
//                     </div>

//                     {/* Job Description */}
//                     <div className="flex flex-col gap-5">
//                         <div id="job-description" className="pt-5">
//                             <h2 className="text-2xl font-bold pb-2">Job Description</h2>
//                             {/* <p>{mockJobs[0].jobDescription}</p> */}

//                             <h3 className="text-xl font-bold py-3">What will make your journey with us unique?</h3>
//                             <ul className="list-disc list-inside">
//                                 <li>A supportive manager who cares about your well-being and is invested in your professional growth.</li>
//                                 <li>A culture of continuous learning with clear targets and feedback.</li>
//                                 <li>A global company with over 2600 employees located in more than 26 countries, including offices in 3 countries.</li>
//                             </ul>

//                         </div>

//                         {/* Requirements */}
//                         <div id="requirements" className="pt-5">
//                             <h2 className="text-2xl font-bold pb-2">Requirements</h2>

//                             <h3 className="text-xl font-bold py-3">What will you do</h3>
//                             <p className="text-gray-500 text-justify">
//                                 {/* {mockJobs[0].jobDescription} */}
//                                 As a UX Designer on our team, you will shape user experiences by leading the design of key features and projects. Your responsibilities include defining user experience flows,
//                                 developing new product concepts, and crafting user stories. You will design detailed UI layouts, create benchmarks, and develop high-fidelity prototypes while documenting UX
//                                 and UI strategies. Collaborating with technical teams, you will transform designs into impactful, industry-leading products. This role combines creativity and problem-solving
//                                 to create meaningful user experiences. Your journey with us is an opportunity to drive innovation and make a significant impact.
//                             </p>

//                             <h3 className="text-xl font-bold py-3">{`What You'll Bring`}</h3>
//                             <ul className="list-disc list-inside">
//                                 <li>Showcase proficiency in collaborative design environments.</li>
//                                 <li>Demonstrated ability to work independently, think critically, and maintain meticulous attention to detail.</li>
//                                 <li>Solid grasp of interactive elements, micro-interactions, and animations, contributing to a seamless user experience.</li>
//                                 <li>Clear understanding of the entire UX lifecycle, coupled with a track record of designing successful apps and products.</li>
//                                 <li>Deep passion for digital product development and an unwavering commitment to achieving excellence.</li>
//                             </ul>

//                         </div>

//                         {/* Benefits */}
//                         <div id="benefits" className="pt-5">
//                             <h2 className="text-2xl font-bold pb-2">Benefit</h2>

//                             <h3 className="text-xl font-bold py-3">Base Pay Range</h3>
//                             <p>
//                                 {mockJobs[0].salaryRange}
//                                 <span className="text-gray-500 ps-2">per/annum</span>
//                             </p>

//                             <h3 className="text-xl font-bold py-3">{`What's in it for you?`}</h3>
//                             <ul className="list-disc list-inside">
//                                 {/* <li>
//                   {mockJobs[0].jobBenefits.split('\n').map((line, index) => (
//                     <span key={index}>
//                       {line}
//                       <br />
//                     </span>
//                   ))}
//                 </li> */}
//                                 <li>Embrace work-life balance with hybrid/remote roles and flexible hours.</li>
//                                 <li>Enjoy 22 days + Birthday + Carnival Tuesday.</li>
//                                 <li>Participate in team-building activities and events.</li>
//                                 <li>Utilize the best tools and technology for work.</li>
//                                 <li>Stay covered with comprehensive health insurance.</li>
//                                 <li>A huge team of UX designers to learn from.</li>
//                             </ul>
//                         </div>

//                         {/* Overview */}
//                         <div id="overview" className="pt-5">
//                             <h2 className="text-2xl font-bold pb-2">Overview</h2>
//                             <div className="flex flex-col gap-4">
//                                 <div className="flex flex-row">
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Size:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compSize}
//                                     </p>
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Founded:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compFounded}
//                                     </p>
//                                 </div>
//                                 <div className="flex flex-row">
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Sector:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compSector}
//                                     </p>
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Industry:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compIndustry}
//                                     </p>
//                                 </div>
//                                 <div className="flex flex-row gap-4">
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Revenue:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compRevenue.toLocaleString()}
//                                     </p>
//                                     <p className="basis-1/10">
//                                         <span className="font-bold">Website:</span>
//                                     </p>
//                                     <p className="basis-4/10">
//                                         {mockJobs[0].branchId.companyId.compWebsite}
//                                     </p>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </>
//     )
// }