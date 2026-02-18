import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 5000);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    // Backward-compatible alias used by some screens.
    const showToast = addToast;

    return (
        <ToastContext.Provider value={{ addToast, showToast, removeToast }}>
            {children}
            <div className="fixed top-5 right-5 z-50 flex flex-col gap-2">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`px-4 py-3 rounded shadow-lg text-white transform transition-all duration-300 ease-in-out
                            ${toast.type === 'success' ? 'bg-emerald-500' :
                                toast.type === 'error' ? 'bg-red-500' :
                                    toast.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}
                        `}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <span>{toast.message}</span>
                            <button onClick={() => removeToast(toast.id)} className="text-white hover:text-gray-200">
                                &times;
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
