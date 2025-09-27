
import React from 'react';
import type { CharacterDesign } from '../types';
import { XIcon, PlusIcon, ChevronRightIcon, SettingsIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  characterDesigns: CharacterDesign[];
  onSelectDesign: (design: CharacterDesign) => void;
  onNewDesign: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, characterDesigns, onSelectDesign, onNewDesign, onOpenSettings }) => {
  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-slate-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-100">メニュー</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-full hover:bg-slate-700">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto">
            {/* Character Design Section */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">3面図キャラクターデザイン</h3>
              <button onClick={onNewDesign} className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                <PlusIcon className="w-4 h-4" />
                新規作成
              </button>
              <div className="space-y-1">
                {characterDesigns.length > 0 ? characterDesigns.map(design => (
                  <button key={design.id} onClick={() => onSelectDesign(design)} className="w-full text-left flex items-center justify-between p-2 rounded-md hover:bg-slate-700 transition-colors">
                    <div className="flex items-center gap-3">
                        <img src={`data:image/png;base64,${design.imageBase64}`} alt={design.name} className="w-10 h-10 rounded-md object-cover bg-slate-700" />
                        <span className="text-slate-300 font-medium text-sm flex-1 truncate">{design.name}</span>
                    </div>
                    <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                  </button>
                )) : (
                  <p className="text-sm text-slate-400 text-center py-4">履歴はありません</p>
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="my-2 border-slate-700"/>

            {/* Stamp Generation Section (Placeholder) */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase mb-2">スタンプ生成</h3>
              <button disabled className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-2 text-sm font-medium text-white bg-slate-600 rounded-lg cursor-not-allowed">
                <PlusIcon className="w-4 h-4" />
                新規作成
              </button>
              <p className="text-sm text-slate-400 text-center py-4">この機能は開発中です</p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700 flex-shrink-0">
            <button onClick={onOpenSettings} className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
              <SettingsIcon className="w-5 h-5 text-slate-400" />
              設定
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
