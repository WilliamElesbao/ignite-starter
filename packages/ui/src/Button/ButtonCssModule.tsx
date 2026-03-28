"use client";

import type { ButtonProps } from "./Button";
import styles from "./ButtonCssModule.module.css";

export const ButtonCssModule = ({ children, className, appName }: ButtonProps) => {
  const mergedClasses = className ? `${styles.button} ${className}` : styles.button;

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