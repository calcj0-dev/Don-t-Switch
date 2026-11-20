// 端末への保存（設計書 1.9・5.3）。保存するのは音の設定だけ。保存できない環境（プライベートブラウズなど）では初期値で動く

import { config } from './data';

type Saved = { sound?: 'on' | 'off' };

function read(): Saved {
  try {
    const raw = globalThis.localStorage?.getItem(config.storageKey);
    return raw ? (JSON.parse(raw) as Saved) : {};
  } catch {
    return {};
  }
}

function write(next: Saved): void {
  try {
    globalThis.localStorage?.setItem(config.storageKey, JSON.stringify(next));
  } catch {
    // 保存できなくても遊べるようにする
  }
}

/** 音を鳴らすか（最初から鳴る：決定 #11） */
export function loadSound(): boolean {
  return read().sound !== 'off';
}

export function saveSound(on: boolean): void {
  write({ ...read(), sound: on ? 'on' : 'off' });
}
