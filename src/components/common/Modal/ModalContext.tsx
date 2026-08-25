import { createContext, useContext } from "react";

export interface ModalContextType {
    footerRef: HTMLDivElement | null;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModalContext = () => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error("Modal components must be used within a Modal");
    }
    return context;
};
