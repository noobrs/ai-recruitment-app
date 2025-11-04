import InputLabel from "./InputLabel";

export default function InputUploadFile(
    { label, className = "", nullable = false }: { label: string, className?: string, nullable?: boolean }) {
    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <InputLabel label={label} nullable={nullable} />}
            <input type="file" className={`p-2 border border-gray-300 rounded-md ${className}`} />
            <p className="text-gray-500 text-start text-sm">Max file size: 10MB</p>
        </div>
    );
}

// example usage
/* 
<InputUploadFile />
*/