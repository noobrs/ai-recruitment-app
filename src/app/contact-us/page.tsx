"use client";

import InputUploadFile from "@/components/shared/inputs/InputUploadFile";
import ButtonFilledBlack from "@/components/shared/buttons/ButtonFilledBlack";
import InputForm from "@/components/shared/inputs/InputForm";
import { useState } from "react";
import InputSearch from "@/components/shared/inputs/InputSearch";

export default function Test() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");

    return (
        <>
            <div className="flex flex-col gap-10 h-fit">

                {/* search */}
                <div className="flex flex-col gap-10 w-full items-center bg-gray-100 py-15">
                    <p className="text-black font-bold text-4xl text-center">How can we help you?</p>
                    <InputSearch placeholder="Search" className="w-3xl mx-auto md:w-1xl" />
                </div>
                
                <div className="w-1/3 mx-auto">
                    <div className="flex flex-col gap-10 mb-30">

                        {/* title */}
                        <div className="flex flex-col gap-2 w-full">
                            <h1 className="text-3xl font-bold">Contact Us</h1>
                            <p className="text-gray-500">Fill in the fields below and we will be able to better respond to your request</p>
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


                                <div className="flex flex-col gap-2">
                                    <InputForm value={subject} onChange={e => setSubject(e.target.value)} placeholder="Enter your Subject" label="Subject" nullable={true} />
                                </div>

                                <InputForm value={message} onChange={e => setMessage(e.target.value)} placeholder="Enter your Message" label="Message" nullable={true} />

                                <InputUploadFile label="Upload File" className="w-full p-2 border border-gray-300 rounded-md" nullable={true} />
                                <ButtonFilledBlack text="Submit" className="w-full p-2 py-3 rounded-md" />
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}