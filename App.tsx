import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { CharacterDesignTab } from './components/CharacterDesignTab';
import { StickerCreationTab } from './components/StickerCreationTab';
import { SettingsModal } from './components/SettingsModal';
import { useLocalStorage } from './hooks/useLocalStorage';
import { LOCAL_STORAGE_KEY } from './constants';
import type { CharacterDesign } from './types';
import { ConfigProvider } from './contexts/ConfigContext';

type Tab = 'design' | 'sticker';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('design');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [characterDesigns, setCharacterDesigns] = useLocalStorage<CharacterDesign[]>(LOCAL_STORAGE_KEY, []);
  const [initialStickerDesign, setInitialStickerDesign] = useState<CharacterDesign | null>(null);

  const handleDesignGenerated = (newDesign: CharacterDesign) => {
    setCharacterDesigns(prev => {
        const existing = prev.find(d => d.id === newDesign.id);
        if (existing) {
            return prev.map(d => d.id === newDesign.id ? newDesign : d);
        }
        return [...prev, newDesign];
    });
  };

  const handleSwitchToStickerTab = (design: CharacterDesign) => {
    setInitialStickerDesign(design);
    setActiveTab('sticker');
  };
  
  const handleSelectDesignFromHistory = (design: CharacterDesign) => {
    setInitialStickerDesign(design);
    setActiveTab('sticker');
    setIsSidebarOpen(false);
  }

  const handleNewDesign = () => {
    setActiveTab('design');
    setIsSidebarOpen(false);
  }

  const handleOpenSettings = () => {
    setIsSidebarOpen(false);
    setIsSettingsModalOpen(true);
  };

  return (
    <ConfigProvider>
      <div className="min-h-screen flex flex-col bg-slate-900">
        <Header 
          onMenuClick={() => setIsSidebarOpen(true)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          characterDesigns={characterDesigns}
          onSelectDesign={handleSelectDesignFromHistory}
          onNewDesign={handleNewDesign}
          onOpenSettings={handleOpenSettings}
        />
        <SettingsModal 
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
        
        <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
          <div className="flex-grow min-h-0">
              <div className={activeTab === 'design' ? 'block h-full' : 'hidden'}>
                <CharacterDesignTab 
                  onDesignGenerated={handleDesignGenerated} 
                  onSwitchToStickerTab={handleSwitchToStickerTab}
                />
              </div>
              <div className={activeTab === 'sticker' ? 'block h-full' : 'hidden'}>
                  <StickerCreationTab
                      initialDesign={initialStickerDesign}
                      characterDesigns={characterDesigns}
                      onSelectDesignFromHistory={handleSelectDesignFromHistory}
                      onSwitchToDesignTab={() => setActiveTab('design')}
                  />
              </div>
          </div>
        </main>
      </div>
    </ConfigProvider>
  );
}

export default App;