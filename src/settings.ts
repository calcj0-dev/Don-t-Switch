// 利用者の設定（音のあり・なし）。端末に保存する（設計書 1.9）

import { loadSound, saveSound } from './storage';

type Listener = () => void;
const listeners = new Set<Listener>();

export const settings = {
  get sound(): boolean {
    return loadSound();
  },
  set sound(v: boolean) {
    saveSound(v);
    for (const fn of listeners) fn();
  },
};

/** 設定が変わったら呼ばれる（音のボタンの見た目を合わせるため）。戻り値で解除 */
export function onSettingsChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
