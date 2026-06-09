"use client";

import type { ButtonProps } from "./button";
import styles from "./button-css-module.module.css";

export const ButtonCssModule = ({
  children,
  className,
  appName,
}: ButtonProps) => {
  const mergedClasses = className
    ? `${styles.button} ${className}`
    : styles.button;

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
