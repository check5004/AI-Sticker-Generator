
import React from 'react';
import { XIcon } from './icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" 
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-100">設定</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700" 
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow p-6 overflow-y-auto">
                    <p className="text-slate-400">現在、設定可能な項目はありません。</p>
                    {/* Future settings will be added here */}
                </div>

                <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl">
                    <button 
                        onClick={onClose} 
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                    >
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
