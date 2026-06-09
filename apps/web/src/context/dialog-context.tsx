"use client";

import {
  createContext,
  type FC,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

interface DialogContextType {
  dialogIsOpen: boolean;
  setDialogIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

interface DialogProviderProps {
  children: ReactNode;
}

export const DialogProvider: FC<DialogProviderProps> = ({ children }) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  const contextValue = useMemo(
    () => ({
      dialogIsOpen,
      setDialogIsOpen,
    }),
    [dialogIsOpen],
  );
  return (
    <DialogContext.Provider value={contextValue}>
      {children}
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextType => {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
};
