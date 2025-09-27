import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { aiConfigManager, AllAIConfigs, AITask, AIConfig } from '../services/aiConfigService';

interface ConfigContextType {
  configs: AllAIConfigs;
  updateConfig: (task: AITask, newConfig: Partial<AIConfig>) => void;
  resetConfig: (task: AITask) => void;
  resetAllConfigs: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [configs, setConfigs] = useState<AllAIConfigs>(aiConfigManager.getAllConfigs());

  const updateConfig = useCallback((task: AITask, newConfig: Partial<AIConfig>) => {
    const updatedConfigs = aiConfigManager.updateConfig(task, newConfig);
    setConfigs(updatedConfigs);
  }, []);

  const resetConfig = useCallback((task: AITask) => {
    const updatedConfigs = aiConfigManager.resetConfig(task);
    setConfigs(updatedConfigs);
  }, []);

  const resetAllConfigs = useCallback(() => {
    const updatedConfigs = aiConfigManager.resetAll();
    setConfigs(updatedConfigs);
  }, []);

  const value = { configs, updateConfig, resetConfig, resetAllConfigs };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};