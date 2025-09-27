import React, { useState, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { CharacterDesign, GenerationResult } from '../types';
import { CATEGORIES } from '../constants';
import { generateCharacterDesign } from '../services/geminiService';
import { Chip } from './Chip';
import { UploadIcon, XIcon, SparklesIcon } from './icons';

const ImageModal: React.FC<{ isOpen: boolean; onClose: () => void; imageUrl: string; }> = ({ isOpen, onClose, imageUrl }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4" 
            onClick={onClose} 
            role="dialog" 
            aria-modal="true"
        >
            <div 
                className="relative max-w-4xl max-h-[90vh] w-full h-full" 
                onClick={e => e.stopPropagation()}
            >
                <img 
                    src={imageUrl} 
                    alt="Enlarged view" 
                    className="w-full h-full object-contain" 
                />
                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 sm:top-4 sm:right-4 p-2 text-white bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-colors" 
                    aria-label="Close modal"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

const ResultDisplay: React.FC<{ result: GenerationResult; onSwitch: () => void; onCustomize: () => void; onRegenerate: () => void; onImageClick: () => void; }> = ({ result, onSwitch, onCustomize, onRegenerate, onImageClick }) => (
    <div className="flex-grow p-4 md:p-6 bg-slate-800 rounded-b-lg flex flex-col gap-4 min-h-0">
        <h3 className="text-lg font-bold text-slate-100 flex-shrink-0">生成結果</h3>
        
        <div className="flex-grow bg-slate-700 p-4 rounded-lg flex flex-col gap-4 min-h-0">
            <div className="flex-shrink-0">
                <h4 className="font-semibold text-slate-200">キャラクター設定</h4>
                <p className="text-sm text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">{result.characterDescription}</p>
            </div>
            
            <div className="flex-grow flex items-center justify-center min-h-0 py-2">
                {result.imageBase64 && (
                    <img 
                        src={`data:image/png;base64,${result.imageBase64}`} 
                        alt="Generated character" 
                        className="max-w-full max-h-full object-contain rounded-md border border-slate-600 cursor-pointer transition-transform hover:scale-105"
                        onClick={onImageClick}
                    />
                )}
            </div>
        </div>
        
        <div className="flex-shrink-0 flex flex-wrap gap-2">
            <button onClick={onSwitch} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">この画像でスタンプを作成する</button>
            <button onClick={onCustomize} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">この画像をさらにカスタマイズする</button>
            <button onClick={onRegenerate} className="px-4 py-2 text-sm font-semibold text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors">生成をやり直す</button>
        </div>
    </div>
);

// FIX: Define props interface for CharacterDesignTab to resolve 'Cannot find name' error.
interface CharacterDesignTabProps {
  onDesignGenerated: (design: CharacterDesign) => void;
  onSwitchToStickerTab: (design: CharacterDesign) => void;
}

export const CharacterDesignTab: React.FC<CharacterDesignTabProps> = ({ onDesignGenerated, onSwitchToStickerTab }) => {
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourcePreviews, setSourcePreviews] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<GenerationResult[]>([]);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 10 - sourceFiles.length);
      setSourceFiles(prev => [...prev, ...files]);
      // FIX: Explicitly type `file` as `File` to fix `unknown` type issue with `URL.createObjectURL`.
      const newPreviews = files.map((file: File) => URL.createObjectURL(file));
      setSourcePreviews(prev => [...prev, ...newPreviews]);
    }
  };
  
  const removeImage = (index: number) => {
    setSourceFiles(prev => prev.filter((_, i) => i !== index));
    setSourcePreviews(prev => {
        const urlToRevoke = prev[index];
        const newPreviews = prev.filter((_, i) => i !== index);
        if (urlToRevoke) {
            URL.revokeObjectURL(urlToRevoke);
        }
        return newPreviews;
    });
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleGenerate = async (isRegen: boolean = false, isCustomize: boolean = false) => {
    if (sourceFiles.length === 0) {
      setError("最低1枚の参考画像をアップロードしてください。");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      let finalPrompt = customPrompt;
      if (isCustomize && results.length > 0) {
          finalPrompt = `前回の結果を元に、以下の指示でカスタマイズしてください：\n${customPrompt}`;
      }

      const { description, imageBase64, fileName } = await generateCharacterDesign(sourceFiles, { categories: selectedCategories, customPrompt: finalPrompt });
      
      const newResult: GenerationResult = {
        id: `design-${Date.now()}`,
        name: `キャラクター案 ${results.length + 1}`,
        createdAt: new Date().toISOString(),
        sourceImageCount: sourceFiles.length,
        settings: { categories: selectedCategories, customPrompt: finalPrompt },
        characterDescription: description,
        finalImageGenPrompt: finalPrompt,
        imageBase64,
        fileName
      };

      onDesignGenerated(newResult);
      setResults(prev => [...prev, newResult]);
      setActiveResultIndex(results.length);
      if(!isRegen && !isCustomize) setCustomPrompt('');

    } catch (err) {
      console.error(err);
      setError("生成中にエラーが発生しました。しばらくしてからもう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  const removeResultTab = (index: number) => {
      setResults(prev => prev.filter((_, i) => i !== index));
      if (activeResultIndex >= index) {
          setActiveResultIndex(prev => Math.max(0, prev - 1));
      }
  };
  
  return (
    <>
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Left Panel */}
      <div className="md:w-1/3 lg:w-1/4 bg-slate-800 rounded-lg shadow-md flex flex-col h-full">
        <h2 className="text-lg font-bold text-slate-100 p-4 border-b border-slate-700 flex-shrink-0">参考画像</h2>
        <div className="p-4 flex-grow overflow-y-auto space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {sourcePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square">
                        <img src={preview} alt={`preview ${index}`} className="w-full h-full object-cover rounded-md"/>
                        <button onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-black bg-opacity-70 text-white rounded-full p-0.5 hover:bg-opacity-100">
                            <XIcon className="w-3 h-3"/>
                        </button>
                    </div>
                ))}
                {sourceFiles.length < 10 && (
                    <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center aspect-square border-2 border-dashed border-slate-600 rounded-md text-slate-500 hover:bg-slate-700 hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                        <UploadIcon className="w-8 h-8"/>
                    </button>
                )}
            </div>
            <input type="file" multiple accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {/* Right Panel */}
      <div className="md:w-2/3 lg:w-3/4 flex flex-col h-full min-h-0">
        <div className="bg-slate-800 rounded-t-lg shadow-md p-4 space-y-4 flex-shrink-0">
          <div>
            <label className="font-semibold text-slate-300 mb-2 block">カテゴリ</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => <Chip key={cat} label={cat} isSelected={selectedCategories.includes(cat)} onClick={() => toggleCategory(cat)} />)}
            </div>
          </div>
          <div>
            <label htmlFor="custom-prompt" className="font-semibold text-slate-300 mb-2 block">詳細な指示</label>
            <textarea
              id="custom-prompt"
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例: 元気で明るい感じの、猫耳の女の子。服装はパーカーでお願いします。"
            />
          </div>
          <button onClick={() => handleGenerate()} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-400 disabled:cursor-not-allowed">
            {isLoading ? "生成中..." : <><SparklesIcon className="w-5 h-5"/>生成</>}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        
        <div className="flex-grow bg-slate-900 rounded-b-lg shadow-md flex flex-col min-h-[300px]">
          {results.length > 0 ? (
            <>
              <div className="flex-shrink-0 border-b border-slate-700 overflow-x-auto">
                  <div className="flex items-center">
                    {results.map((res, index) => (
                        <button key={res.id} onClick={() => setActiveResultIndex(index)} 
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeResultIndex === index ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-400 hover:bg-slate-700'}`}>
                            <span>{res.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); removeResultTab(index); }} className="p-0.5 rounded-full hover:bg-slate-600">
                                <XIcon className="w-3 h-3"/>
                            </button>
                        </button>
                    ))}
                  </div>
              </div>
              <ResultDisplay 
                  result={results[activeResultIndex]}
                  onSwitch={() => onSwitchToStickerTab(results[activeResultIndex])}
                  onCustomize={() => handleGenerate(false, true)}
                  onRegenerate={() => handleGenerate(true, false)}
                  onImageClick={() => setIsModalOpen(true)}
              />
            </>
          ) : (
            <div className="flex-grow flex items-center justify-center text-slate-400">
              <p>ここに生成結果が表示されます</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageUrl={results.length > 0 && results[activeResultIndex] ? `data:image/png;base64,${results[activeResultIndex].imageBase64}` : ''}
    />
    </>
  );
};