"use client";

import styles from "./button-css-module.module.css";
import type { ButtonProps } from "./custom-button";

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
