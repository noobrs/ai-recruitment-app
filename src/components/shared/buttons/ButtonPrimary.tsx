export default function ButtonPrimary(
    { text, icon, className = "" }: { text: string, icon?: React.ReactNode, className?: string }) {
    return (
        <>
            <button className={`px-2 py-1 rounded-3xl border-1 border-primary-100 text-primary hover:bg-primary-100 hover:text-white transition-all duration-300 ${className}`}>
                <div className="flex flex-row items-center justify-center gap-2">
                    <span className={"fill-primary hover:fill-white transition-all duration-300"}>{icon ? icon : null}</span>
                    <span className={"font-bold hover:text-white transition-all duration-300"}>{text}</span>
                </div>
            </button>
        </>
    );
}

// example usage
/* 
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/16/solid";
...
<ButtonPrimary text="Sign Up" icon={<ArrowLeftEndOnRectangleIcon className="w-7 h-7"/>} className="w-32 h-10" /> 
*/