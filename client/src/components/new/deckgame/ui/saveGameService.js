import { post } from '../../../../utilities.js';
export const LOCAL_SAVE_SLOTS = ['1', '2'];
export const AUTOSAVE_SLOT = 'auto';
export const SAVE_PREFIX = 'deckgame_save_';
export const GAME_NAME = 'ustcdeckgame';

export function getSaveKey(slot) {
  return `${SAVE_PREFIX}${slot}`;
}

export function readLocalSaveSlot(slot) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(getSaveKey(slot));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    return null;
  }
}

export function readLocalSaves(slots = LOCAL_SAVE_SLOTS) {
  return slots.map((slot) => ({ slot, save: readLocalSaveSlot(slot) }));
}

export function normalizeCloudSave(raw) {
  if (!raw || raw.gamename !== GAME_NAME || !raw.gamedata) return null;
  return {
    ...raw.gamedata,
    _id: raw._id,
    cloudRecord: raw,
    savedAt: raw.gamedata.savedAt || raw.visdate || raw.regdate,
  };
}

export function sortSavesByTime(saves) {
  return [...saves].sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime());
}

export function getLatestSave(saves) {
  return sortSavesByTime(saves.filter(Boolean))[0] || null;
}

export function formatSaveTime(value) {
  if (!value) return '未知时间';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '未知时间';
  return date.toLocaleString('zh-CN', { hour12: false });
}

export function loadCloudSaveRecords() {
  return post('/api/game/loadgame', {});
}

export function parseCloudSaveList(res) {
  if (res && res.error) return { error: res.error, saves: [] };
  const list = Array.isArray(res) ? res : [];
  return { error: null, saves: sortSavesByTime(list.map(normalizeCloudSave).filter(Boolean)) };
}