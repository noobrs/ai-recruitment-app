export default function ButtonFilledBlack(
    { text, icon, className = "" }: { text: string, icon?: React.ReactNode, className?: string }) {
    return (
        <>
            <button type="submit" className={`px-2 py-1 rounded-3xl border-1 border-black text-white bg-black hover:bg-white hover:text-black transition-all duration-300 ${className}`}>
                <div className="flex flex-row items-center justify-center gap-2">
                    {icon ? <span className={"fill-white hover:fill-black transition-all duration-300"}>{icon}</span> : null}
                    <span className={"font-bold transition-all duration-300"}>{text}</span>
                </div>
            </button>
        </>
    );
}

// example usage
/* 
<ButtonFilledBlack text="Sign Up" className="w-32 h-10" /> 
*/