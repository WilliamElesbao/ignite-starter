"use client";

import type { ButtonProps } from "./custom-button";

export const ButtonTailwind = ({
  children,
  className,
  appName,
}: ButtonProps) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40";

  const mergedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button
      type="button"
      className={mergedClasses}
      onClick={() => alert(`Hello from your ${appName} app!`)}
    >
      {children}
    </button>
  );
};
