import React from 'react';
import { MenuIcon, SparklesIcon } from './icons';

type Tab = 'design' | 'sticker';

interface HeaderProps {
  onMenuClick: () => void;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void; }> = ({ label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors ${isActive ? 'bg-slate-600 text-slate-100' : 'text-slate-400 hover:bg-slate-700'}`}
    >
        {label}
    </button>
);


export const Header: React.FC<HeaderProps> = ({ onMenuClick, activeTab, onTabChange }) => {
  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <button
              onClick={onMenuClick}
              className="p-2 text-slate-400 rounded-full hover:bg-slate-700 hover:text-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <SparklesIcon className="w-7 h-7 text-indigo-500" />
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 whitespace-nowrap">
              AI Sticker Generator
            </h1>
          </div>
          
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex items-center p-1 bg-slate-900 rounded-lg space-x-1">
                  <TabButton label="3面図作成" isActive={activeTab === 'design'} onClick={() => onTabChange('design')} />
                  <TabButton label="スタンプ作成" isActive={activeTab === 'sticker'} onClick={() => onTabChange('sticker')} />
              </div>
          </div>
        </div>
      </div>
    </header>
  );
};