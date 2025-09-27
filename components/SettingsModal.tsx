import React, { useState, useEffect } from 'react';
import { XIcon } from './icons';
import { useConfig } from '../contexts/ConfigContext';
import { AITask, AIConfig, AllAIConfigs, DEFAULT_CONFIGS } from '../services/aiConfigService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const aiTasks = Object.values(AITask);

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { configs, updateConfig, resetAllConfigs, resetConfig } = useConfig();
    const [localConfigs, setLocalConfigs] = useState<AllAIConfigs>(configs);
    const [activeTab, setActiveTab] = useState<AITask>(aiTasks[0]);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setLocalConfigs(configs);
            setHasChanges(false);
        }
    }, [isOpen, configs]);

    const handlePromptChange = (task: AITask, prompt: string) => {
        setLocalConfigs(prev => ({
            ...prev,
            [task]: { ...prev[task], prompt }
        }));
        setHasChanges(true);
    };

    const handleSave = () => {
        aiTasks.forEach(task => {
            if (JSON.stringify(localConfigs[task]) !== JSON.stringify(configs[task])) {
                updateConfig(task, localConfigs[task]);
            }
        });
        setHasChanges(false);
        onClose();
    };

    const handleResetAll = () => {
        resetAllConfigs();
        setHasChanges(false);
        onClose();
    };
    
    const handleResetCurrent = () => {
        const taskToReset = activeTab;
        setLocalConfigs(prev => {
            const newConfigs = { ...prev, [taskToReset]: DEFAULT_CONFIGS[taskToReset] };
            // We need to compare against the original saved config, not the default one.
            if(JSON.stringify(newConfigs[taskToReset]) !== JSON.stringify(configs[taskToReset])){
                setHasChanges(true);
            }
            return newConfigs;
        });
    };


    if (!isOpen) return null;
    
    const currentConfig = localConfigs[activeTab];

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-100">AI設定</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700" 
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row min-h-0">
                    <div className="w-full md:w-1/4 border-b md:border-b-0 md:border-r border-slate-700 flex-shrink-0 p-2 overflow-y-auto">
                        <nav className="flex flex-row md:flex-col gap-1">
                            {aiTasks.map(task => (
                                <button
                                    key={task}
                                    onClick={() => setActiveTab(task)}
                                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                        activeTab === task ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                                    }`}
                                >
                                    {configs[task].name}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="flex-grow p-4 md:p-6 overflow-y-auto flex flex-col">
                        <div className="flex-grow flex flex-col">
                            <h3 className="text-lg font-bold text-slate-100">{currentConfig.name}</h3>
                            <p className="text-sm text-slate-400 mt-1 mb-4">{currentConfig.description}</p>
                            
                             <div className="mb-2 flex items-center justify-between">
                                <label htmlFor="prompt-textarea" className="font-semibold text-slate-300">
                                    システムプロンプト
                                </label>
                                <button onClick={handleResetCurrent} className="text-xs text-indigo-400 hover:underline">
                                    このプロンプトをデフォルトに戻す
                                </button>
                            </div>
                            
                            <textarea
                                id="prompt-textarea"
                                value={currentConfig.prompt}
                                onChange={(e) => handlePromptChange(activeTab, e.target.value)}
                                className="w-full flex-grow p-3 bg-slate-900 border border-slate-600 rounded-md text-slate-200 font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[200px]"
                                placeholder="AIへの指示を入力..."
                            />
                        </div>
                    </div>
                </div>


                <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl">
                    <button 
                        onClick={handleResetAll} 
                        className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/50 rounded-lg transition-colors"
                    >
                        全ての設定をリセット
                    </button>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                        >
                            キャンセル
                        </button>
                         <button 
                            onClick={handleSave} 
                            disabled={!hasChanges}
                            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed"
                        >
                            保存して閉じる
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};