import React, { useState, useEffect, useRef } from 'react';
import type { Sticker } from '../types';
import { reviseStickerImage } from '../services/geminiService';
import { REVISE_SUGGESTIONS } from '../constants';
import { XIcon, SparklesIcon } from './icons';

interface RevisionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sticker: Sticker | null;
    characterDescription: string;
    onApplyRevision: (stickerId: string, newImage: string, newText: string, newFileName: string) => void;
}

export const RevisionModal: React.FC<RevisionModalProps> = ({ isOpen, onClose, sticker, characterDescription, onApplyRevision }) => {
    const [revisionPrompt, setRevisionPrompt] = useState('');
    const [isRevising, setIsRevising] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentRevision, setCurrentRevision] = useState<{ image: string, text: string, fileName: string } | null>(null);
    const textInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (!isOpen) {
            // Reset state on close
            setRevisionPrompt('');
            setIsRevising(false);
            setError(null);
            setCurrentRevision(null);
        }
    }, [isOpen]);

    if (!isOpen || !sticker) return null;

    const handleRevise = async () => {
        setIsRevising(true);
        setError(null);
        try {
            const result = await reviseStickerImage(
                currentRevision?.image || sticker.image,
                currentRevision?.text || sticker.text,
                characterDescription,
                revisionPrompt
            );
            
            const newText = result.revisedText || (currentRevision?.text || sticker.text);

            setCurrentRevision({
                image: result.imageBase64,
                text: newText,
                fileName: result.fileName
            });
            setRevisionPrompt('');
        } catch (err) {
            console.error(err);
            setError("修正案の生成中にエラーが発生しました。");
        } finally {
            setIsRevising(false);
        }
    };

    const handleApply = () => {
        if (currentRevision) {
            onApplyRevision(sticker.id, currentRevision.image, currentRevision.text, currentRevision.fileName);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        let finalSuggestion = suggestion;
        if (suggestion.includes(': ')) {
            finalSuggestion = suggestion.split(':')[0] + ': ';
            setRevisionPrompt(finalSuggestion);
            textInputRef.current?.focus();
        } else {
             setRevisionPrompt(suggestion);
        }
    };

    const displayedImage = currentRevision?.image || sticker.image;
    const displayedText = currentRevision?.text || sticker.text;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-100">AIで修正</h2>
                    <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700" aria-label="Close modal">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-grow flex flex-col md:flex-row gap-4 p-4 overflow-y-auto min-h-0">
                    {/* Left: Preview */}
                    <div className="md:w-1/2 lg:w-2/5 flex-shrink-0 flex flex-col items-center gap-4 bg-slate-900 p-4 rounded-lg">
                        <h3 className="font-semibold text-slate-300 self-start">プレビュー</h3>
                        <div className="w-full aspect-square bg-slate-700 rounded-lg flex items-center justify-center p-2">
                             {displayedImage ? 
                                <img src={`data:image/png;base64,${displayedImage}`} alt="Sticker preview" className="max-w-full max-h-full object-contain" /> :
                                <p className="text-slate-500">プレビューなし</p>
                             }
                        </div>
                        <p className="w-full text-center bg-slate-700 p-2 rounded-md text-slate-200 break-words">{displayedText}</p>
                    </div>

                    {/* Right: Controls */}
                    <div className="md:w-1/2 lg:w-3/5 flex flex-col gap-4">
                         <div>
                            <label htmlFor="revision-prompt" className="font-semibold text-slate-300 mb-2 block">修正の指示</label>
                            <div className="flex gap-2">
                                <input
                                    id="revision-prompt"
                                    type="text"
                                    ref={textInputRef}
                                    value={revisionPrompt}
                                    onChange={e => setRevisionPrompt(e.target.value)}
                                    placeholder="例: もっと楽しそうな表情にして"
                                    className="flex-grow p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-indigo-500"
                                />
                                <button onClick={handleRevise} disabled={isRevising || !revisionPrompt} className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-slate-500">
                                    <SparklesIcon className="w-4 h-4"/>
                                    {isRevising ? '生成中...' : '依頼'}
                                </button>
                            </div>
                        </div>

                        <div>
                             <h4 className="font-semibold text-slate-400 text-sm mb-2">修正案の候補</h4>
                             <div className="flex flex-wrap gap-2">
                                 {[...REVISE_SUGGESTIONS.text, ...REVISE_SUGGESTIONS.image].map(s => (
                                     <button key={s} onClick={() => handleSuggestionClick(s)} className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600">
                                         {s}
                                     </button>
                                 ))}
                             </div>
                        </div>
                         {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center justify-end gap-4 p-4 border-t border-slate-700 bg-slate-800 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600">キャンセル</button>
                    <button onClick={handleApply} disabled={!currentRevision || isRevising} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-slate-500">
                        このデザインを適用
                    </button>
                </div>
            </div>
        </div>
    );
};
