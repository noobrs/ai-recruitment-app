import React from "react";

interface ButtonFilledBlackProps {
  text: string;
  icon?: React.ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}

export default function ButtonFilledBlack({
  text,
  icon,
  className = "",
  type = "button",
  disabled = false,
  onClick,
}: ButtonFilledBlackProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-3xl border border-black text-white bg-black 
        hover:bg-white hover:text-black transition-all duration-300 
        flex flex-row items-center justify-center gap-2 font-bold
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {icon && (
        <span className="fill-white group-hover:fill-black transition-all duration-300">
          {icon}
        </span>
      )}
      <span>{text}</span>
    </button>
  );
}
