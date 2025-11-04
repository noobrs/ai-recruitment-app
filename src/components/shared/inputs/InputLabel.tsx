export default function InputLabel({ label, nullable, className }: { label: string, nullable: boolean, className?: string }) {
    return (
        <label className={`text-black text-start font-bold ${className}`}>{label}
            {nullable === false && <span className="text-red-500">*</span>}
        </label>
    );
}