import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import ConfirmationModal from '../components/ConfirmationModal';
import PromptModal from '../components/PromptModal';

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
    const [promptConfig, setPromptConfig] = useState(null);
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

    const prompt = useCallback((options) => {
        setPromptConfig({
            title: options.title || 'Input Required',
            message: options.message || 'Please provide some information',
            placeholder: options.placeholder || 'Type here...',
            confirmLabel: options.confirmLabel || 'Submit',
            cancelLabel: options.cancelLabel || 'Cancel',
        });

        return new Promise((resolve) => {
            resolver.current = resolve;
        });
    }, []);

    const handleConfirm = useCallback((value = true) => {
        setConfig(null);
        setPromptConfig(null);
        resolver.current(value);
    }, []);

    const handleCancel = useCallback(() => {
        setConfig(null);
        setPromptConfig(null);
        resolver.current(null);
    }, []);

    return (
        <ConfirmationContext.Provider value={{ confirm, prompt }}>
            {children}
            {config && (
                <ConfirmationModal
                    {...config}
                    onConfirm={() => handleConfirm(true)}
                    onCancel={handleCancel}
                />
            )}
            {promptConfig && (
                <PromptModal
                    {...promptConfig}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmationContext.Provider>
    );
};
