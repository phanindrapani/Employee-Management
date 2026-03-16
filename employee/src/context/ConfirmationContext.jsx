import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';

const ConfirmationContext = createContext();

export const useConfirmation = () => {
    const context = useContext(ConfirmationContext);
    if (!context) {
        throw new Error('useConfirmation must be used within a ConfirmationProvider');
    }
    return context;
};

export const ConfirmationProvider = ({ children }) => {
    const [config, setConfig] = useState(null);
    const resolver = useRef();

    const confirm = useCallback((options) => {
        setConfig({
            title: options.title || 'Confirm Action',
            message: options.message || 'Are you sure you want to proceed?',
            confirmLabel: options.confirmLabel || 'Confirm',
            cancelLabel: options.cancelLabel || 'Cancel',
            type: options.type || 'danger',
        });

        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setConfig(null);
        resolver.current(true);
    }, []);

    const handleCancel = useCallback(() => {
        setConfig(null);
        resolver.current(false);
    }, []);

    return (
        <ConfirmationContext.Provider value={confirm}>
            {children}
            {config && (
                <ConfirmationModal
                    {...config}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmationContext.Provider>
    );
};
