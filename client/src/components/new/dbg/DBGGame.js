import React from 'react';
import DBGGameUI from './ui/DBGGameUI';
import DBGGameMenu from './ui/DBGGameMenu';

export default class DBGGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: 'menu',
      sessionKey: 0,
      initialSaveSlot: null,
      initialSaveData: null,
      difficulty: null,
      tutorialMode: false,
      tutorialId: null,
    };
  }

  componentDidMount() {
    this.syncPageChromeHidden();
  }

  componentDidUpdate() {
    this.syncPageChromeHidden();
  }

  componentWillUnmount() {
    this.setPageChromeHidden(false);
  }

  setPageChromeHidden(hidden) {
    if (typeof document === 'undefined') return;
    document.body.classList.toggle('dbg-game-active', hidden);
  }

  syncPageChromeHidden() {
    this.setPageChromeHidden(this.state.screen === 'game');
  }

  startNewGame = (difficulty) => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: null,
      difficulty,
      tutorialMode: false,
      tutorialId: null,
    }));
  };

  startTutorial = (tutorialId = 'complete_tutorial') => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: null,
      difficulty: null,
      tutorialMode: true,
      tutorialId,
    }));
  };

  loadGame = (slot) => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: slot,
      initialSaveData: null,
      difficulty: null,
      tutorialMode: false,
      tutorialId: null,
    }));
  };

  loadCloudGame = (save) => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: save,
      difficulty: null,
      tutorialMode: false,
      tutorialId: null,
    }));
  };

  backToMenu = () => {
    this.setState({
      screen: 'menu',
      initialSaveSlot: null,
      initialSaveData: null,
      difficulty: null,
      tutorialMode: false,
      tutorialId: null,
    });
  };

  render() {
    if (this.state.screen === 'game') {
      return (
        <DBGGameUI
          key={this.state.sessionKey}
          initialSaveSlot={this.state.initialSaveSlot}
          initialSaveData={this.state.initialSaveData}
          difficulty={this.state.difficulty}
          tutorialMode={this.state.tutorialMode}
          tutorialId={this.state.tutorialId}
          onBackToMenu={this.backToMenu}
        />
      );
    }
    return (
      <DBGGameMenu
        onNewGame={this.startNewGame}
        onStartTutorial={this.startTutorial}
        onLoadGame={this.loadGame}
        onLoadCloudGame={this.loadCloudGame}
      />
    );
  }
}
