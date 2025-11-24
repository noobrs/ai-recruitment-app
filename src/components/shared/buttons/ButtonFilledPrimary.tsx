export default function ButtonFilledPrimary(
    { text, icon, className = "", onClick, disabled = false }: { text: string, icon?: React.ReactNode, className?: string, onClick?: () => void, disabled?: boolean }) {
    return (
        <button onClick={onClick}
            disabled={disabled}
            className={`px-2 py-1 rounded-3xl border border-primary text-black bg-primary hover:bg-white hover:text-primary transition-all duration-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'} ${className}`}>

            <div className="flex flex-row items-center justify-center gap-2">
                {icon ? <span className={"fill-white hover:fill-primary transition-all duration-300"}>{icon}</span> : null}
                <span className={"font-bold transition-all duration-300"}>{text}</span>
            </div>
        </button>
    );
}

// example usage
/* 
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/16/solid";
...
<ButtonFilledPrimary text="Sign Up" icon={<ArrowLeftEndOnRectangleIcon className="w-7 h-7"/>} className="w-32 h-10" /> 
*/