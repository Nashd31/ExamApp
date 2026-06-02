import { createContext, useContext } from 'react';

export const DialogContext = createContext(null);

export function useDialog() {
    const ctx = useContext(DialogContext);
    if (!ctx) throw new Error('useDialog must be used inside a <DialogProvider>');
    return ctx;
}
