"use client";

import React, { useState } from "react";
import InputLabel from "./InputLabel";

interface InputUploadFileProps {
  label: string;
  className?: string;
  nullable?: boolean;
  onChange?: (file: File | null) => void;
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
        alert(`File exceeds ${maxSizeMB} MB limit.`);
        e.target.value = ""; // reset file input
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
    <div className="flex flex-col gap-2 w-full">
      {label && <InputLabel label={label} nullable={nullable} />}
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className={`p-2 border border-gray-300 rounded-md bg-white cursor-pointer ${className}`}
      />
      <p className="text-gray-500 text-sm text-start">
        Max file size: {maxSizeMB}MB
      </p>

      {fileName && (
        <p className="text-gray-600 text-sm truncate">📄 {fileName}</p>
      )}
    </div>
  );
}
