import React from "react";

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  onClick,
  children,
  className = "",
  disabled,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`${className} disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px] transition-all active:scale-[0.98]`}
    {...props}
  >
    {loading ? (
      <>
        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span>Loading...</span>
      </>
    ) : (
      children
    )}
  </button>
);
