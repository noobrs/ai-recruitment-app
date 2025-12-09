'use client';

import React, { useState } from "react";
import InputLabel from "./InputLabel";
import toast from 'react-hot-toast';

interface InputUploadFileProps {
  label: string;
  className?: string;
  nullable?: boolean;
  onChange?: (file: File | null) => void;
  /** 
   * Accept file types, e.g.:
   * ".pdf,.doc,.docx" or "image/*" or "application/pdf,image/*"
   * Images: accept="image/*"
   * PDFs: accept=".pdf"
   * Mixed: accept=".pdf,image/*"
   */
  accept?: string;
  maxSizeMB?: number;
}

export default function InputUploadFile({
  label,
  className = "",
  nullable = false,
  onChange,
  accept = ".pdf,.doc,.docx",
  maxSizeMB = 10,
}: InputUploadFileProps) {
  const [fileName, setFileName] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`File exceeds ${maxSizeMB} MB limit.`);
        e.target.value = "";
        return;
      }
      setFileName(file.name);
      onChange?.(file);
    } else {
      setFileName("");
      onChange?.(null);
    }
  };

  return (
    <div className={`flex flex-col gap-2 w-full ${className}`}>
      {label && <InputLabel label={label} nullable={nullable} />}

      <label className="block border border-gray-300 rounded-md px-4 py-3 text-gray-600 cursor-pointer hover:border-primary transition text-center">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        {fileName ? (
          <div className="flex items-center gap-2 text-gray-800 justify-center">
            <img src="/file-icon.svg" alt="file" className="w-5 h-5" />
            <span className="truncate">{fileName}</span>
          </div>
        ) : (
          <span className="text-gray-400">Choose a file</span>
        )}
      </label>

      <p className="text-gray-500 text-sm">
        Supported formats: PDF, JPG, PNG (max {maxSizeMB}MB)
      </p>
    </div>
  );
}
