export const STORAGE_KEY = 'healthops_v1_beta7';
export function saveState(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
export function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; } }
