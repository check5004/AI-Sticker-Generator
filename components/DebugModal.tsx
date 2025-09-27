import React from 'react';
import type { Sticker } from '../types';
import { XIcon } from './icons';

interface DebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    sticker: Sticker | null;
}

export const DebugModal: React.FC<DebugModalProps> = ({ isOpen, onClose, sticker }) => {
    if (!isOpen || !sticker || !sticker.generationPayload) return null;

    const { prompt, images } = sticker.generationPayload;
    const [characterImage, textImage] = images;

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
                    <h2 className="text-xl font-bold text-slate-100">デバッグ情報</h2>
                    <button 
                        onClick={onClose} 
                        className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700" 
                        aria-label="Close modal"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-y-auto min-h-0">
                    {/* Left: Images */}
                    <div className="md:w-1/2 flex flex-col gap-4">
                        <h3 className="text-lg font-semibold text-slate-200">入力画像</h3>
                        <div className="flex-grow grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-medium text-slate-400 text-center">キャラクター画像</h4>
                                <div className="aspect-square bg-slate-700 rounded-lg p-2 flex items-center justify-center">
                                    <img 
                                        src={`data:image/png;base64,${characterImage}`} 
                                        alt="Character Input" 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            </div>
                             <div className="flex flex-col gap-2">
                                <h4 className="text-sm font-medium text-slate-400 text-center">テキスト画像</h4>
                                <div className="aspect-square bg-slate-700 rounded-lg p-2 flex items-center justify-center">
                                     <img 
                                        src={`data:image/png;base64,${textImage}`} 
                                        alt="Text Input" 
                                        className="max-w-full max-h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Right: Prompt */}
                    <div className="md:w-1/2 flex flex-col gap-2">
                        <h3 className="text-lg font-semibold text-slate-200">プロンプト</h3>
                        <div className="flex-grow bg-slate-900 rounded-lg p-3 overflow-auto">
                            <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                                {prompt}
                            </pre>
                        </div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-end p-4 border-t border-slate-700">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};
