import React, { useState, useEffect, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { CharacterDesign, Sticker, StickerStatus, StickerGenerationPayload } from '../types';
import { TONES, TEXT_DECORATIONS } from '../constants';
import { generateStickerTexts, generateStickerImage, fileToBase64, generateSuggestions } from '../services/geminiService';
import { aiConfigManager, AITask, renderTemplate } from '../services/aiConfigService';
import { createTextImage } from '../services/imageUtils';
import { Chip } from './Chip';
import { SparklesIcon, DownloadIcon, UploadIcon, PlusIcon, BugIcon } from './icons';
import { RevisionModal } from './RevisionModal';
import { DebugModal } from './DebugModal';
import { useAppSettings } from '../contexts/AppSettingsContext';

declare var JSZip: any;

const StickerCard: React.FC<{
    sticker: Sticker;
    onTextChange: (id: string, text: string) => void;
    onRevise: (sticker: Sticker) => void;
    onDownload: (sticker: Sticker) => void;
    onDebug: (sticker: Sticker) => void;
}> = ({ sticker, onTextChange, onRevise, onDownload, onDebug }) => {
    const statusClasses: Record<StickerStatus, string> = {
        idle: 'border-slate-600',
        generating_text: 'border-blue-500 animate-pulse',
        generating_image: 'border-indigo-500 animate-pulse',
        done: 'border-green-500',
        error: 'border-red-500',
    };

    const StatusIndicator: React.FC<{ status: StickerStatus }> = ({ status }) => {
        if(status === 'done') return null;
        let text = '準備中';
        if(status === 'generating_text') text = 'テキスト生成中...';
        if(status === 'generating_image') text = '画像生成中...';
        if(status === 'error') text = 'エラー';

        return <div className="absolute inset-0 bg-slate-800/80 flex items-center justify-center text-sm font-semibold text-slate-200">{text}</div>;
    }

    return (
        <div className={`relative bg-slate-800 rounded-lg shadow border-2 ${statusClasses[sticker.status]} flex flex-col`}>
            <div className="aspect-square w-full bg-slate-700 rounded-t-lg relative flex items-center justify-center">
                {sticker.image ? <img src={`data:image/png;base64,${sticker.image}`} className="w-full h-full object-contain"/> : <span className="text-slate-500 text-sm">画像未生成</span>}
                <StatusIndicator status={sticker.status}/>
            </div>
            <div className="p-2 flex-grow flex flex-col">
                <textarea
                    value={sticker.text}
                    onChange={(e) => onTextChange(sticker.id, e.target.value)}
                    className="w-full text-sm p-1 bg-slate-700 border border-slate-600 rounded-md flex-grow text-slate-200 focus:ring-1 focus:ring-indigo-500"
                    rows={2}
                />
            </div>
            <div className="p-2 border-t border-slate-700 flex items-center justify-between">
                 <button 
                    onClick={() => onRevise(sticker)}
                    disabled={sticker.status !== 'done'}
                    className="text-xs text-indigo-400 hover:underline disabled:text-slate-500 disabled:cursor-not-allowed disabled:no-underline"
                >
                    AIで修正
                </button>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onDebug(sticker)}
                        disabled={!sticker.generationPayload}
                        className="text-slate-400 disabled:text-slate-600 hover:text-slate-100 transition-colors"
                        aria-label="Debug info"
                    >
                        <BugIcon className="w-4 h-4"/>
                    </button>
                    <button 
                        disabled={!sticker.image || sticker.status !== 'done'}
                        onClick={() => onDownload(sticker)}
                        className="text-indigo-500 disabled:text-slate-500"
                        aria-label="Download sticker"
                    >
                        <DownloadIcon className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    )
};


interface StickerCreationTabProps {
  initialDesign: CharacterDesign | null;
  characterDesigns: CharacterDesign[];
  onSelectDesignFromHistory: (design: CharacterDesign) => void;
  onSwitchToDesignTab: () => void;
}

export const StickerCreationTab: React.FC<StickerCreationTabProps> = ({ initialDesign, characterDesigns, onSelectDesignFromHistory, onSwitchToDesignTab }) => {
  const [selectedDesign, setSelectedDesign] = useState<CharacterDesign | null>(initialDesign);
  const [stickerCount, setStickerCount] = useState<number>(8);
  const [includeText, setIncludeText] = useState<boolean>(true);
  
  const [tones, setTones] = useState<string[]>(TONES);
  const [textDecorations, setTextDecorations] = useState<string[]>(TEXT_DECORATIONS);

  const [selectedTone, setSelectedTone] = useState<string>(TONES[0]);
  const [selectedDecoration, setSelectedDecoration] = useState<string>(TEXT_DECORATIONS[0]);

  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [stickerToRevise, setStickerToRevise] = useState<Sticker | null>(null);
  
  const [isGeneratingTones, setIsGeneratingTones] = useState(false);
  const [isGeneratingDecorations, setIsGeneratingDecorations] = useState(false);
  const [customStickerPrompt, setCustomStickerPrompt] = useState<string>('');
  const { appSettings } = useAppSettings();

  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [stickerToDebug, setStickerToDebug] = useState<Sticker | null>(null);


  useEffect(() => {
      setSelectedDesign(initialDesign);
  }, [initialDesign]);

  const handleCustomImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const base64 = await fileToBase64(file);
          const newDesign: CharacterDesign = {
              id: `custom-${Date.now()}`,
              name: file.name,
              createdAt: new Date().toISOString(),
              sourceImageCount: 1,
              settings: { categories: [], customPrompt: 'Custom upload' },
              characterDescription: 'ユーザーがアップロードしたカスタムキャラクター',
              finalImageGenPrompt: '',
              imageBase64: base64
          };
          setSelectedDesign(newDesign);
      }
  };

  const initializeStickers = () => {
      const newStickers = Array.from({ length: stickerCount }, (_, i) => ({
        id: `sticker-${i}-${Date.now()}`,
        text: '',
        image: '',
        fileName: '',
        status: 'idle' as StickerStatus,
      }));
      setStickers(newStickers);
  };
  
  useEffect(() => {
    initializeStickers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickerCount, selectedDesign]);

  const handleGenerateTexts = async () => {
    if (!selectedDesign) return;
    setIsLoading(true);
    setStickers(stickers.map(s => ({...s, status: 'generating_text'})));
    try {
        const texts = await generateStickerTexts(selectedDesign.characterDescription, stickerCount, { tone: selectedTone, decoration: selectedDecoration, customPrompt: customStickerPrompt });
        setStickers(prev => prev.map((sticker, index) => ({
            ...sticker,
            text: texts[index] || `テキスト${index+1}`,
            status: 'idle',
        })));
    } catch(err) {
        setError("テキスト生成エラー");
        setStickers(prev => prev.map(s => ({...s, status: 'error'})));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleGenerateImages = async () => {
      if (!selectedDesign) return;
      setIsLoading(true);
      setError(null);
      setStickers(stickers.map(s => ({...s, status: 'generating_image'})));

      const BATCH_SIZE = 4;
      let processingStickers = [...stickers];
      
      const textImageOptions = {
          decorationStyle: selectedDecoration,
          fontSize: 48,
          fontColor: '#333333',
          imageHeight: appSettings.textImageHeight,
      };

      const stickerImageConfig = aiConfigManager.getConfig(AITask.STICKER_IMAGE);
      const prompt = renderTemplate(stickerImageConfig.prompt, {
          characterDescription: selectedDesign.characterDescription,
          customPrompt: customStickerPrompt,
      });

      for (let i = 0; i < processingStickers.length; i += BATCH_SIZE) {
          const batch = processingStickers.slice(i, i + BATCH_SIZE);
          await Promise.all(batch.map(async (sticker) => {
              try {
                  const textImageBase64 = await createTextImage(sticker.text, textImageOptions);
                  
                  const payload: StickerGenerationPayload = {
                    prompt,
                    images: [selectedDesign.imageBase64, textImageBase64],
                  };

                  const { imageBase64, fileName } = await generateStickerImage(
                    selectedDesign.imageBase64, 
                    textImageBase64,
                    selectedDesign.characterDescription, 
                    customStickerPrompt
                  );
                  setStickers(prev => prev.map(s => s.id === sticker.id ? { ...s, image: imageBase64, fileName, status: 'done', generationPayload: payload } : s));
              } catch (e) {
                  console.error(`Error generating sticker ${sticker.id}:`, e);
                  setStickers(prev => prev.map(s => s.id === sticker.id ? { ...s, status: 'error' } : s));
              }
          }));
      }

      setIsLoading(false);
  };

  const handleGenerateMoreSuggestions = async (type: 'tone' | 'decoration') => {
      if (type === 'tone') {
          setIsGeneratingTones(true);
          try {
              const newSuggestions = await generateSuggestions('tone', tones);
              setTones(prev => [...prev, ...newSuggestions.filter(s => !prev.includes(s))]);
          } catch (e) {
              console.error("Failed to generate more tones:", e);
          } finally {
              setIsGeneratingTones(false);
          }
      } else {
          setIsGeneratingDecorations(true);
          try {
              const newSuggestions = await generateSuggestions('decoration', textDecorations);
              setTextDecorations(prev => [...prev, ...newSuggestions.filter(s => !prev.includes(s))]);
          } catch (e) {
              console.error("Failed to generate more decorations:", e);
          } finally {
              setIsGeneratingDecorations(false);
          }
      }
  };

  const handleTextChange = (id: string, text: string) => {
      setStickers(prev => prev.map(s => s.id === id ? { ...s, text } : s));
  };
  
  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const doneStickers = stickers.filter(s => s.status === 'done' && s.image);
    
    doneStickers.forEach(sticker => {
        zip.file(sticker.fileName || `${sticker.id}.png`, sticker.image, { base64: true });
    });
    
    zip.generateAsync({ type: 'blob' }).then(content => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `${selectedDesign?.name}_stickers.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }

  const handleDownloadSingle = (sticker: Sticker) => {
    if (!sticker.image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${sticker.image}`;
    link.download = sticker.fileName || `${sticker.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenRevisionModal = (sticker: Sticker) => {
    if (sticker.status === 'done') {
        setStickerToRevise(sticker);
        setIsRevisionModalOpen(true);
    }
  };

  const handleCloseRevisionModal = () => {
      setIsRevisionModalOpen(false);
      setStickerToRevise(null);
  };
  
  const handleOpenDebugModal = (sticker: Sticker) => {
    if (sticker.generationPayload) {
      setStickerToDebug(sticker);
      setIsDebugModalOpen(true);
    }
  };

  const handleCloseDebugModal = () => {
    setIsDebugModalOpen(false);
    setStickerToDebug(null);
  };

  const handleApplyRevision = (stickerId: string, newImage: string, newText: string, newFileName: string) => {
      setStickers(prev => prev.map(s => 
          s.id === stickerId ? { ...s, image: newImage, text: newText, fileName: newFileName, status: 'done' } : s
      ));
      handleCloseRevisionModal();
  };


  return (
    <>
    <div className="flex flex-col md:flex-row gap-4 h-full">
      {/* Left Panel */}
      <div className="md:w-1/3 lg:w-1/4 bg-slate-800 rounded-lg shadow-md flex flex-col h-full">
        <h2 className="text-lg font-bold text-slate-100 p-4 border-b border-slate-700">3面図キャラクター</h2>
        <div className="p-4 flex-grow overflow-y-auto space-y-4">
            {selectedDesign ? (
                <div className="space-y-2">
                    <img src={`data:image/png;base64,${selectedDesign.imageBase64}`} alt={selectedDesign.name} className="w-full rounded-md border border-slate-700" />
                    <h3 className="font-semibold text-center text-slate-200">{selectedDesign.name}</h3>
                    <button onClick={onSwitchToDesignTab} className="w-full text-sm text-center text-indigo-400 hover:underline">3面図をもっと調整する</button>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-10">
                    <p>キャラクターを選択またはアップロードしてください</p>
                </div>
            )}
             <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium border-2 border-dashed border-slate-600 rounded-lg hover:border-indigo-500 hover:text-indigo-400 transition-colors">
                <UploadIcon className="w-4 h-4" /> PCからアップロード
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleCustomImageUpload} className="hidden" />
             <div>
                <h4 className="font-semibold text-slate-400 text-sm mb-2">履歴から選択</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                    {characterDesigns.map(d => (
                        <button key={d.id} onClick={() => onSelectDesignFromHistory(d)} className={`w-full flex items-center gap-2 p-1.5 rounded-md text-left transition-colors ${selectedDesign?.id === d.id ? 'bg-indigo-900/50' : 'hover:bg-slate-700'}`}>
                            <img src={`data:image/png;base64,${d.imageBase64}`} alt={d.name} className="w-8 h-8 rounded object-cover"/>
                            <span className="text-sm font-medium text-slate-300 truncate">{d.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="md:w-2/3 lg:w-3/4 flex flex-col h-full bg-slate-800 rounded-lg shadow-md">
        <div className="p-4 border-b border-slate-700 space-y-4 flex-shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="font-semibold text-slate-300 mb-2 block text-sm">スタンプ個数</label>
              <div className="flex items-center justify-between p-1 bg-slate-700 border border-slate-600 rounded-md text-sm text-slate-200">
                <button
                    onClick={() => setStickerCount(prev => Math.max(4, prev - 4))}
                    disabled={stickerCount <= 4}
                    className="px-4 py-1 font-bold bg-slate-800 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Decrement sticker count"
                >
                    -
                </button>
                <span className="font-semibold">{stickerCount}個</span>
                <button
                    onClick={() => setStickerCount(prev => Math.min(48, prev + 4))}
                    disabled={stickerCount >= 48}
                    className="px-4 py-1 font-bold bg-slate-800 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Increment sticker count"
                >
                    +
                </button>
              </div>
            </div>
             <div>
              <label className="font-semibold text-slate-300 mb-2 block text-sm">口調・雰囲気</label>
              <div className="flex flex-wrap gap-2 items-center">
                {tones.map(tone => <Chip key={tone} label={tone} isSelected={selectedTone === tone} onClick={() => setSelectedTone(tone)}/>)}
                <button
                  onClick={() => handleGenerateMoreSuggestions('tone')}
                  disabled={isGeneratingTones}
                  className="p-1.5 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  aria-label="Generate more tones"
                >
                  {isGeneratingTones ?
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> :
                    <PlusIcon className="w-4 h-4"/>
                  }
                </button>
              </div>
            </div>
            <div>
              <label className="font-semibold text-slate-300 mb-2 block text-sm">文字の装飾</label>
              <div className="flex flex-wrap gap-2 items-center">
                {textDecorations.map(dec => <Chip key={dec} label={dec} isSelected={selectedDecoration === dec} onClick={() => setSelectedDecoration(dec)}/>)}
                <button
                  onClick={() => handleGenerateMoreSuggestions('decoration')}
                  disabled={isGeneratingDecorations}
                  className="p-1.5 bg-slate-700 text-slate-300 rounded-full hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-wait"
                  aria-label="Generate more decorations"
                >
                  {isGeneratingDecorations ?
                    <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> :
                    <PlusIcon className="w-4 h-4"/>
                  }
                </button>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="custom-sticker-prompt" className="font-semibold text-slate-300 mb-2 block text-sm">
              デザインに関する自由な指示
            </label>
            <textarea
              id="custom-sticker-prompt"
              value={customStickerPrompt}
              onChange={(e) => setCustomStickerPrompt(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="例: 全てのスタンプにキラキラしたエフェクトを追加してください。キャラクターは常に笑顔で。"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleGenerateTexts} disabled={isLoading || !selectedDesign} className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-500">
                <SparklesIcon className="w-4 h-4"/> 文字のデザインを生成
            </button>
            <button onClick={handleGenerateImages} disabled={isLoading || !selectedDesign} className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-500">
                <SparklesIcon className="w-4 h-4"/> スタンプ画像を生成
            </button>
             <button onClick={handleDownloadAll} disabled={isLoading || stickers.every(s=>s.status !== 'done')} className="px-4 py-2 flex items-center gap-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-500">
                <DownloadIcon className="w-4 h-4"/> 一括ダウンロード
            </button>
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto bg-slate-900">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {stickers.map(sticker => (
                  <StickerCard
                    key={sticker.id}
                    sticker={sticker}
                    onTextChange={handleTextChange}
                    onRevise={handleOpenRevisionModal}
                    onDownload={handleDownloadSingle}
                    onDebug={handleOpenDebugModal}
                  />
              ))}
          </div>
        </div>
      </div>
    </div>
    {selectedDesign && (
        <RevisionModal
            isOpen={isRevisionModalOpen}
            onClose={handleCloseRevisionModal}
            sticker={stickerToRevise}
            characterDescription={selectedDesign.characterDescription}
            onApplyRevision={handleApplyRevision}
        />
    )}
    <DebugModal 
        isOpen={isDebugModalOpen}
        onClose={handleCloseDebugModal}
        sticker={stickerToDebug}
    />
    </>
  );
};
