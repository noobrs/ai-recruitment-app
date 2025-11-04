"use client";

import { useState } from "react";
import InputForm from "@/components/shared/inputs/InputForm";
import InputUploadFile from "@/components/shared/inputs/InputUploadFile";
import ButtonFilledBlack from "@/components/shared/buttons/ButtonFilledBlack";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function Test() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [coverLetter, setCoverLetter] = useState("");

    return (
        <>
            <div className="flex flex-col gap-10 h-fit mt-15">
                <div className="w-1/3 mx-auto">
                    <div className="flex flex-col gap-10 mb-30">

                        {/* job details */}
                        <div className="flex flex-col w-full gap-4">

                            {/* back button */}
                            <ArrowLeftIcon className="w-6 h-6" />

                            <div className="flex flex-row items-center">
                                <img src="/next.svg" alt="" className="w-8 h-8 mr-2" />
                                <p className="text-lg text-gray-500">Amazon Company</p>
                            </div>

                            <h1 className="text-5xl font-bold">Product designer</h1>
                            <p className="text-gray-500 font-bold text-sm">Porto, Portugal (Full-time)</p>
                        </div>

                        <div className="w-full h-px bg-gray-200"></div>

                        {/* title */}
                        <div className="flex flex-col w-full">
                            <h2 className="text-3xl font-bold">Personal Information</h2>
                        </div>

                        {/* form */}
                        <div className="flex flex-col w-full">
                            <form className="flex flex-col gap-10">
                                <div className="flex flex-row gap-8">
                                    <InputForm value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Enter your First Name" label="First Name" />
                                    <InputForm value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Enter your Last Name" label="Last Name" />
                                </div>

                                <div className="flex flex-row gap-8">
                                    <InputForm value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your Email" label="Email" />
                                    <InputForm value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="Enter your Phone Number" label="Phone Number" />
                                </div>

                                <InputUploadFile label="Upload CV" className="w-full p-2 border border-gray-300 rounded-md" />
                                <InputUploadFile label="Additional File" className="w-full p-2 border border-gray-300 rounded-md" nullable={true} />
                                <InputForm value={coverLetter} onChange={e => setCoverLetter(e.target.value)} placeholder="Enter your Cover Letter" label="Cover Letter" nullable={true} />

                                <ButtonFilledBlack text="Submit" className="w-full p-2 py-3 rounded-md" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}