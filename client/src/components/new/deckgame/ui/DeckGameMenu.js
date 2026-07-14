import React from 'react';
import {
  LOCAL_SAVE_SLOTS,
  readLocalSaves,
  getLatestSave,
  formatSaveTime,
  loadCloudSaveRecords,
  parseCloudSaveList,
} from './saveGameService';

const styles = {
  page: {
    minHeight: '100vh',
    padding: 24,
    background: '#eef4fb',
    color: '#172033',
    fontFamily: 'Arial, sans-serif',
    boxSizing: 'border-box',
  },
  shell: {
    maxWidth: 1080,
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 420px) minmax(420px, 1fr)',
    gap: 16,
    alignItems: 'start',
  },
  panel: {
    background: '#fff',
    border: '1px solid #d8e1ee',
    borderRadius: 8,
    padding: 16,
    boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
  },
  title: { margin: 0, fontSize: 28, lineHeight: 1.15 },
  subtitle: { marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.5 },
  actions: { display: 'grid', gridTemplateColumns: '1fr', gap: 10, marginTop: 18 },
  primaryButton: {
    border: '1px solid #2563eb', background: '#2563eb', color: '#fff', borderRadius: 7,
    padding: '10px 12px', fontWeight: 800, cursor: 'pointer', textAlign: 'left',
  },
  secondaryButton: {
    border: '1px solid #cbd5e1', background: '#fff', color: '#1f2937', borderRadius: 7,
    padding: '10px 12px', fontWeight: 700, cursor: 'pointer', textAlign: 'left',
  },
  disabledButton: {
    border: '1px solid #d8e1ee', background: '#f8fafc', color: '#94a3b8', borderRadius: 7,
    padding: '10px 12px', fontWeight: 700, cursor: 'not-allowed', textAlign: 'left',
  },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 10 },
  sectionTitle: { margin: 0, fontSize: 16, fontWeight: 800 },
  saveList: { display: 'grid', gridTemplateColumns: '1fr', gap: 8 },
  saveItem: {
    display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center',
    border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, background: '#f8fafc',
  },
  saveName: { fontSize: 14, fontWeight: 800, marginBottom: 4 },
  saveMeta: { color: '#64748b', fontSize: 12, lineHeight: 1.45 },
  smallButton: {
    border: '1px solid #2563eb', background: '#fff', color: '#1d4ed8', borderRadius: 7,
    padding: '6px 9px', fontWeight: 800, cursor: 'pointer',
  },
  hint: { color: '#64748b', fontSize: 12, lineHeight: 1.45, marginTop: 10 },
};

function getSaveTitle(slot, save, cloud = false) {
  if (cloud) return save && save.name ? save.name : '云端存档';
  if (save && save.name) return save.name;
  return `本地槽位 ${slot}`;
}

function getSaveMeta(save) {
  if (!save) return '没有存档';
  const meta = save.meta || {};
  return `第 ${meta.semester || '?'} 学期 · ${meta.phase || '未知阶段'} · ${formatSaveTime(save.savedAt)}`;
}

export default class DeckGameMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cloudSaves: [],
      cloudMessage: '正在确认云端登录状态...',
      cloudLoading: false,
      cloudAvailable: false,
      loginChecked: false,
    };
  }

  componentDidMount() {
    this.refreshCloudSaves({ initial: true });
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

  getLatestLocalSave() {
    const latest = this.getLatestLocalSaveItem();
    return latest ? latest.save : null;
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
    if (this.props.onLoadGame) {
      this.props.onLoadGame(slot);
      return;
    }
    if (typeof window !== 'undefined' && window.alert) window.alert('Load save failed: missing callback');
  };

  handleLoadCloudGame = (save) => {
    if (this.props.onLoadCloudGame) {
      this.props.onLoadCloudGame(save);
      return;
    }
    if (typeof window !== 'undefined' && window.alert) window.alert('Load cloud save failed: missing callback');
  };

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

  render() {
    const latestLocal = this.getLatestLocalSave();
    const saves = this.getLocalSaves();
    const { cloudSaves, cloudMessage, cloudLoading, cloudAvailable, loginChecked } = this.state;
    return (
      <div style={styles.page}>
        <div style={styles.shell}>
          <div style={styles.panel}>
            <h1 style={styles.title}>USTC Deckgame</h1>
            <div style={styles.subtitle}>从本地槽位继续，查询账号下的云端存档，或者进入新手教程。</div>
            <div style={styles.actions}>
              <button type="button" style={styles.primaryButton} onClick={this.props.onNewGame}>新游戏</button>
              <button type="button" style={styles.secondaryButton} onClick={this.props.onStartTutorial}>开始新手教程</button>
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
            <div style={styles.hint}>游戏内存档栏显示两个本地槽位和最新云端存档；完整云端列表在这里手动查询。</div>
          </div>
        </div>
      </div>
    );
  }
}