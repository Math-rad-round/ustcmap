import React from 'react';
import DeckGameUI from './ui/DeckGameUI';
import DeckGameMenu from './ui/DeckGameMenu';

export default class DeckGame extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: 'menu',
      sessionKey: 0,
      initialSaveSlot: null,
      initialSaveData: null,
      tutorialMode: false,
    };
  }

  startNewGame = () => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: null,
      tutorialMode: false,
    }));
  };

  startTutorial = () => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: null,
      tutorialMode: true,
    }));
  };

  loadGame = (slot) => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: slot,
      initialSaveData: null,
      tutorialMode: false,
    }));
  };

  loadCloudGame = (save) => {
    this.setState((state) => ({
      screen: 'game',
      sessionKey: state.sessionKey + 1,
      initialSaveSlot: null,
      initialSaveData: save,
      tutorialMode: false,
    }));
  };

  backToMenu = () => {
    this.setState({ screen: 'menu', initialSaveSlot: null, initialSaveData: null, tutorialMode: false });
  };

  render() {
    if (this.state.screen === 'game') {
      return (
        <DeckGameUI
          key={this.state.sessionKey}
          initialSaveSlot={this.state.initialSaveSlot}
          initialSaveData={this.state.initialSaveData}
          tutorialMode={this.state.tutorialMode}
          onBackToMenu={this.backToMenu}
        />
      );
    }
    return (
      <DeckGameMenu
        onNewGame={this.startNewGame}
        onStartTutorial={this.startTutorial}
        onLoadGame={this.loadGame}
        onLoadCloudGame={this.loadCloudGame}
      />
    );
  }
}