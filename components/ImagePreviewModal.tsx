import React from 'react';
import type { Sticker } from '../types';
import { XIcon, SparklesIcon, DownloadIcon } from './icons';

interface ImagePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sticker: Sticker | null;
    onRevise: (sticker: Sticker) => void;
    onDownload: (sticker: Sticker) => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ isOpen, onClose, sticker, onRevise, onDownload }) => {
    if (!isOpen || !sticker) return null;

    const handleRevise = () => {
        if (sticker) {
            onRevise(sticker);
            onClose(); // Close this modal before opening the revision modal
        }
    };

    const handleDownload = () => {
        if (sticker) {
            onDownload(sticker);
        }
    };
    
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-lg font-bold text-slate-100 truncate pr-4">{sticker.text}</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700 flex-shrink-0" aria-label="Close modal">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-grow p-4 flex items-center justify-center min-h-0 bg-slate-900">
                    {sticker.image ? (
                        <img 
                            src={`data:image/png;base64,${sticker.image}`} 
                            alt={sticker.text} 
                            className="max-w-full max-h-full object-contain rounded-md" 
                        />
                    ) : (
                        <p className="text-slate-500">画像がありません</p>
                    )}
                </div>

                <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl">
                    <button 
                        onClick={handleRevise}
                        className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors flex items-center gap-2"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        AIで修正
                    </button>
                    <button 
                        onClick={handleDownload}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        ダウンロード
                    </button>
                </div>
            </div>
        </div>
    );
};