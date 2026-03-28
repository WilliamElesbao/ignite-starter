"use client";

import type { ReactNode } from "react";
import { ButtonTailwind } from "./ButtonTailwind";

export interface ButtonProps {
  children: ReactNode;
  className?: string;
  appName: string;
}

export const Button = ({ children, className, appName }: ButtonProps) => {
  return (
    <ButtonTailwind className={className} appName={appName}>
      {children}
    </ButtonTailwind>
  );
};
