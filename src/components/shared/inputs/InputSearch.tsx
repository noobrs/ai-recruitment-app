import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";

export default function InputSearch({ placeholder, className }: { placeholder: string, className?: string }) {
    return (
            <div className="relative">
                <input type="text" placeholder={placeholder} className={`px-4 py-4 pl-15 rounded-4xl outline-none transition-colors duration-200
                border border-gray-300
                focus:border-blue-500
                hover:border-blue-400
                ${className}
            `} />

                <MagnifyingGlassIcon className="h-6 w-6 text-gray-500 absolute left-5 top-1/2 -translate-y-1/2 fill-gray-500" />
            </div>
    );
}