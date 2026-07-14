import React from 'react';
import {
  LOCAL_SAVE_SLOTS,
  readLocalSaves,
  getLatestSave,
  formatSaveTime,
  loadCloudSaveRecords,
  parseCloudSaveList,
  readProgress,
  setDebugUnlockAll,
} from './saveGameService';
import config from '../data/GameConfig.json';
import tutorials from '../data/Tutorials.json';

const DIFFICULTY_ORDER = ['easy', 'standard', 'harsh'];

const styles = {
  page: {
    minHeight: 'calc(100vh - 56px)',
    padding: 24,
    background: '#eceee9',
    color: '#171720',
    fontFamily: 'Arial, "Microsoft YaHei", sans-serif',
    boxSizing: 'border-box',
  },
  shell: {
    maxWidth: 1080,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 420px) minmax(420px, 1fr)',
    gap: 14,
    alignItems: 'start',
  },
  panel: {
    background: '#fffaf0',
    border: '3px solid #171720',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 3px 0 rgba(0, 0, 0, 0.2)',
  },
  title: { margin: 0, fontSize: 30, lineHeight: 1.12 },
  subtitle: { marginTop: 8, color: '#596653', fontSize: 14, fontWeight: 800, lineHeight: 1.5 },
  actions: { display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 18 },
  primaryButton: {
    border: '3px solid #171720', background: '#38d774', color: '#171720', borderRadius: 7,
    padding: '10px 12px', fontWeight: 900, cursor: 'pointer', textAlign: 'left',
  },
  secondaryButton: {
    border: '3px solid #171720', background: '#f8f7ef', color: '#171720', borderRadius: 7,
    padding: '10px 12px', fontWeight: 900, cursor: 'pointer', textAlign: 'left',
  },
  disabledButton: {
    border: '3px solid #9b9b91', background: '#dedbd0', color: '#77766e', borderRadius: 7,
    padding: '10px 12px', fontWeight: 900, cursor: 'not-allowed', textAlign: 'left',
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 900 },
  saveList: { display: 'grid', gridTemplateColumns: '1fr', gap: 8 },
  saveItem: {
    display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
    border: '2px solid rgba(23, 23, 32, 0.24)', borderRadius: 8, padding: 10, background: '#f8f7ef',
  },
  saveName: { fontSize: 14, fontWeight: 900, marginBottom: 4 },
  saveMeta: { color: '#596653', fontSize: 12, fontWeight: 800, lineHeight: 1.45 },
  smallButton: {
    border: '2px solid #171720', background: '#eff6ff', color: '#171720', borderRadius: 7,
    padding: '6px 9px', fontWeight: 900, cursor: 'pointer',
  },
  hint: { color: '#596653', fontSize: 12, fontWeight: 800, lineHeight: 1.45, marginTop: 10 },
  difficultyGroup: { display: 'grid', gap: 7, marginTop: 18 },
  difficultyTitle: { color: '#596653', fontSize: 12, fontWeight: 900 },
  difficultyButtons: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  difficultyButton: {
    minHeight: 56,
    border: '3px solid #171720',
    borderRadius: 7,
    background: '#f8f7ef',
    color: '#171720',
    padding: '7px 8px',
    fontWeight: 900,
    cursor: 'pointer',
    textAlign: 'left',
  },
  activeDifficultyButton: {
    background: '#f0ea00',
    boxShadow: 'inset 0 0 0 2px rgba(23, 23, 32, 0.2)',
  },
  difficultyDesc: { color: '#596653', fontSize: 12, fontWeight: 800, lineHeight: 1.4 },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1000,
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    background: 'rgba(23, 23, 32, 0.52)',
  },
  modal: {
    width: 'min(420px, 92vw)',
    display: 'grid',
    gap: 10,
    padding: 14,
    border: '4px solid #171720',
    borderRadius: 10,
    background: '#fffaf0',
    boxShadow: '0 8px 0 rgba(0, 0, 0, 0.28)',
  },
  modalTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontWeight: 900 },
  modalText: { margin: 0, color: '#334155', fontSize: 13, fontWeight: 800, lineHeight: 1.45 },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 8 },
};

function getSaveTitle(slot, save, cloud = false) {
  if (cloud) return save && save.name ? save.name : '云端存档';
  if (save && save.name) return save.name;
  return `本地槽位 ${slot}`;
}

function getSaveMeta(save) {
  if (!save) return '没有存档';
  const meta = save.meta || {};
  const role = meta.character ? ` · ${meta.character}` : '';
  const difficulty = meta.difficulty ? ` · ${meta.difficulty}` : '';
  return `第 ${meta.turn || '?'} 回合 · ${meta.phase || '未知阶段'} · 上传 ${meta.upload || 0}/${meta.uploadTarget || '?'}${difficulty}${role} · ${formatSaveTime(save.savedAt)}`;
}

export default class DBGGameMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cloudSaves: [],
      cloudMessage: '正在确认云端登录状态...',
      cloudLoading: false,
      cloudAvailable: false,
      loginChecked: false,
      selectedDifficulty: config.defaultDifficulty || 'standard',
      progress: readProgress(),
      devUnlockOpen: false,
    };
    this.devUnlockTimer = null;
  }

  componentDidMount() {
    this.refreshCloudSaves({ initial: true });
  }

  componentWillUnmount() {
    this.cancelDevUnlockHold();
  }

  getLocalSaves() {
    return readLocalSaves(LOCAL_SAVE_SLOTS);
  }

  getLatestLocalSaveItem() {
    const saves = this.getLocalSaves();
    const latestSave = getLatestSave(saves.map((item) => item.save));
    if (!latestSave) return null;
    return saves.find((item) => item.save && item.save.savedAt === latestSave.savedAt) || null;
  }

  goLogin = () => {
    if (typeof window !== 'undefined') window.location.href = '/signin';
  };

  refreshCloudSaves = (options = {}) => {
    this.setState({ cloudLoading: true, cloudMessage: options.initial ? '正在确认云端登录状态...' : '正在查询云端存档...' });
    loadCloudSaveRecords()
      .then((res) => {
        const parsed = parseCloudSaveList(res);
        if (parsed.error) {
          this.setState({
            cloudSaves: [],
            cloudLoading: false,
            cloudAvailable: false,
            loginChecked: true,
            cloudMessage: '未登录，云端存档不可用',
          });
          return;
        }
        this.setState({
          cloudSaves: parsed.saves,
          cloudLoading: false,
          cloudAvailable: true,
          loginChecked: true,
          cloudMessage: parsed.saves.length ? `已登录，找到 ${parsed.saves.length} 个云端存档` : '已登录，暂无云端存档',
        });
      })
      .catch(() => {
        this.setState({
          cloudSaves: [],
          cloudLoading: false,
          cloudAvailable: false,
          loginChecked: true,
          cloudMessage: '云端连接失败',
        });
      });
  };

  handleLoadGame = (slot) => {
    if (this.props.onLoadGame) this.props.onLoadGame(slot);
  };

  handleLoadCloudGame = (save) => {
    if (this.props.onLoadCloudGame) this.props.onLoadCloudGame(save);
  };

  startDevUnlockHold = () => {
    this.cancelDevUnlockHold();
    if (typeof window === 'undefined') return;
    this.devUnlockTimer = window.setTimeout(() => {
      this.devUnlockTimer = null;
      this.setState({ devUnlockOpen: true });
    }, 5000);
  };

  cancelDevUnlockHold = () => {
    if (this.devUnlockTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.devUnlockTimer);
    }
    this.devUnlockTimer = null;
  };

  unlockAllForDev = () => {
    const progress = setDebugUnlockAll(true);
    this.setState({ progress, devUnlockOpen: false });
  };

  getDifficulties() {
    const difficulties = config.difficulties || {};
    return DIFFICULTY_ORDER
      .filter((id) => difficulties[id])
      .map((id) => difficulties[id]);
  }

  renderDifficultyPicker() {
    const difficulties = this.getDifficulties();
    const selected = config.difficulties?.[this.state.selectedDifficulty] || difficulties[0];
    return (
      <div style={styles.difficultyGroup}>
        <div style={styles.difficultyTitle}>新游戏难度</div>
        <div style={styles.difficultyButtons}>
          {difficulties.map((difficulty) => {
            const active = difficulty.id === this.state.selectedDifficulty;
            return (
              <button
                type="button"
                key={difficulty.id}
                style={{ ...styles.difficultyButton, ...(active ? styles.activeDifficultyButton : {}) }}
                onClick={() => this.setState({ selectedDifficulty: difficulty.id })}
              >
                {difficulty.name}
              </button>
            );
          })}
        </div>
        <div style={styles.difficultyDesc}>{selected?.description || ''}</div>
      </div>
    );
  }

  renderSaveItem(slot, save) {
    return (
      <div key={slot} style={styles.saveItem}>
        <div>
          <div style={styles.saveName}>{getSaveTitle(slot, save)}</div>
          <div style={styles.saveMeta}>{getSaveMeta(save)}</div>
        </div>
        <button type="button" disabled={!save} onClick={() => save && this.handleLoadGame(slot)} style={save ? styles.smallButton : styles.disabledButton}>
          读取
        </button>
      </div>
    );
  }

  renderCloudSaveItem(save, index) {
    return (
      <div key={save._id || `${save.savedAt}-${index}`} style={styles.saveItem}>
        <div>
          <div style={styles.saveName}>{getSaveTitle(null, save, true)}</div>
          <div style={styles.saveMeta}>{getSaveMeta(save)}</div>
        </div>
        <button type="button" onClick={() => this.handleLoadCloudGame(save)} style={styles.smallButton}>读取</button>
      </div>
    );
  }

  renderDevUnlockModal() {
    if (!this.state.devUnlockOpen) return null;
    return (
      <div style={styles.modalBackdrop} onMouseDown={(event) => { if (event.target === event.currentTarget) this.setState({ devUnlockOpen: false }); }}>
        <section style={styles.modal}>
          <div style={styles.modalTitle}>
            <strong>开发解锁</strong>
            <button type="button" style={styles.smallButton} onClick={() => this.setState({ devUnlockOpen: false })}>关闭</button>
          </div>
          <p style={styles.modalText}>启用本地开发解锁后，所有角色都会在本浏览器中可选；这不会写入通关记录。</p>
          <div style={styles.modalActions}>
            <button type="button" style={styles.secondaryButton} onClick={() => this.setState({ devUnlockOpen: false })}>取消</button>
            <button type="button" style={styles.primaryButton} onClick={this.unlockAllForDev}>全解锁</button>
          </div>
        </section>
      </div>
    );
  }

  render() {
    const latestLocalItem = this.getLatestLocalSaveItem();
    const latestLocal = latestLocalItem ? latestLocalItem.save : null;
    const saves = this.getLocalSaves();
    const { cloudSaves, cloudMessage, cloudLoading, cloudAvailable, loginChecked } = this.state;
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.panel}>
            <h1
              style={{ ...styles.title, userSelect: 'none', cursor: 'default' }}
              onPointerDown={this.startDevUnlockHold}
              onPointerUp={this.cancelDevUnlockHold}
              onPointerLeave={this.cancelDevUnlockHold}
              onPointerCancel={this.cancelDevUnlockHold}
            >
              USTC DBG
            </h1>
            <div style={styles.subtitle}>选择角色，发展装备，在越来越沉重的威胁前完成上传。</div>
            {this.renderDifficultyPicker()}
            <div style={styles.actions}>
              <button type="button" style={styles.primaryButton} onClick={() => this.props.onNewGame?.(this.state.selectedDifficulty)}>新游戏</button>
              {tutorials.map((tutorial) => (
                <button type="button" key={tutorial.id} style={styles.secondaryButton} onClick={() => this.props.onStartTutorial?.(tutorial.id)}>
                  教程 · {tutorial.name}
                </button>
              ))}
              <button
                type="button"
                style={latestLocal ? styles.secondaryButton : styles.disabledButton}
                disabled={!latestLocal}
                onClick={() => {
                  if (latestLocalItem) this.handleLoadGame(latestLocalItem.slot);
                }}
              >
                继续本地游戏{latestLocal ? ` · ${formatSaveTime(latestLocal.savedAt)}` : ''}
              </button>
              {loginChecked && !cloudAvailable && (
                <button type="button" style={styles.primaryButton} onClick={this.goLogin}>登录来云端保存</button>
              )}
              <button type="button" style={cloudAvailable ? styles.secondaryButton : styles.disabledButton} onClick={() => this.refreshCloudSaves()} disabled={cloudLoading || !cloudAvailable}>
                {cloudLoading ? '查询中...' : '查询所有云端存档'}
              </button>
            </div>
          </div>
          <div style={styles.panel}>
            <div style={styles.sectionHeader}>
              <div style={styles.sectionTitle}>读取存档</div>
              <div style={styles.saveMeta}>{cloudMessage}</div>
            </div>
            <div style={styles.saveList}>
              {saves.map(({ slot, save }) => this.renderSaveItem(slot, save))}
              {cloudSaves.map((save, index) => this.renderCloudSaveItem(save, index))}
            </div>
            <div style={styles.hint}>游戏内可以保存到两个本地槽位，并会自动维护一个自动存档；云端完整列表在这里查询。</div>
          </div>
        </div>
        {this.renderDevUnlockModal()}
      </div>
    );
  }
}
