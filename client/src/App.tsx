import React, { useEffect } from 'react';
import { Header } from './components/Header.js';
import { GameContainer } from './game/GameContainer.js';
import { TacticalConsole } from './components/TacticalConsole.js';
import { SyncStatusToast } from './components/SyncStatusToast.js';
import { useChoreStore } from './store/choreStore.js';

export const App: React.FC = () => {
  const { fetchChores, highContrast } = useChoreStore();

  useEffect(() => {
    // Initial fetch of pending chores
    fetchChores();
  }, [fetchChores]);

  return (
    <div className={`app-container ${highContrast ? 'high-contrast' : ''}`}>
      <Header />
      <main className="main-content" role="main">
        <GameContainer />
        <TacticalConsole />
      </main>
      <SyncStatusToast />
    </div>
  );
};

export default App;
