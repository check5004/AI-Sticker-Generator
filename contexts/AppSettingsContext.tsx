import React, { createContext, useContext, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { LOCAL_STORAGE_APP_SETTINGS_KEY } from '../constants';
import type { AppSettings } from '../types';

const DEFAULT_APP_SETTINGS: AppSettings = {
    textImageHeight: 10,
};

interface AppSettingsContextType {
    appSettings: AppSettings;
    updateAppSettings: (newSettings: AppSettings) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appSettings, setAppSettings] = useLocalStorage<AppSettings>(LOCAL_STORAGE_APP_SETTINGS_KEY, DEFAULT_APP_SETTINGS);

    const updateAppSettings = (newSettings: AppSettings) => {
        setAppSettings(newSettings);
    };

    const value = { appSettings, updateAppSettings };

    return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
};

export const useAppSettings = (): AppSettingsContextType => {
    const context = useContext(AppSettingsContext);
    if (context === undefined) {
        throw new Error('useAppSettings must be used within an AppSettingsProvider');
    }
    return context;
};