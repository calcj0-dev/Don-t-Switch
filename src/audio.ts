// 効果音（設計書 1.9・決定 #11）。素材ファイルは使わず Web Audio で合成する（前作の audio.ts を流用）。
// iOS は利用者が触ったときに AudioContext を作る・再開する必要がある

import { settings } from './settings';

let ctx: AudioContext | null = null;

/** 最初のタッチ・クリックで呼ぶ。以後は鳴らせるようになる */
export function unlockAudio(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

type Tone = {
  freq: number;
  /** 終わりの周波数（音の高さを動かすとき） */
  to?: number;
  type?: OscillatorType;
  /** 開始までの遅れ（秒） */
  at?: number;
  dur: number;
  gain?: number;
};

function play(tones: Tone[]): void {
  if (!settings.sound || !ctx || ctx.state !== 'running') return;
  const now = ctx.currentTime;
  for (const tone of tones) {
    const t0 = now + (tone.at ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tone.type ?? 'sine';
    osc.frequency.setValueAtTime(tone.freq, t0);
    if (tone.to) osc.frequency.exponentialRampToValueAtTime(tone.to, t0 + tone.dur);
    const peak = tone.gain ?? 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + tone.dur + 0.02);
  }
}

/** 短い雑音（「ドサッ」の札束の音） */
function thud(at = 0): void {
  if (!settings.sound || !ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + at;
  const len = Math.floor(ctx.sampleRate * 0.25);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 600;
  const g = ctx.createGain();
  g.gain.value = 0.5;
  src.connect(lp).connect(g).connect(ctx.destination);
  src.start(t0);
}

/** 硬貨の音を1回。pitch は1.0が基準（日が進むほど少し高く） */
const coin = (at: number, pitch: number): Tone[] => [
  { freq: 1975 * pitch, type: 'triangle', at, dur: 0.09, gain: 0.09 },
  { freq: 2637 * pitch, type: 'triangle', at: at + 0.06, dur: 0.28, gain: 0.08 },
];

export const sfx = {
  /** 「次の日へ」：チャリン を count 回。day が進むほど少し高く */
  chalin: (count: number, day: number) => {
    const pitch = 1 + (Math.min(Math.max(day, 1), 30) - 1) * 0.008;
    play(Array.from({ length: count }, (_, i) => coin(i * 0.09, pitch * (1 + i * 0.04))).flat());
  },
  /** 乗り換え：ドサッ */
  dosa: () => {
    thud();
    play([{ freq: 120, to: 60, type: 'sine', dur: 0.25, gain: 0.25 }]);
  },
  /** 28日目：ジャーン */
  jaan: () =>
    play([
      { freq: 392, type: 'sawtooth', at: 0.15, dur: 1.4, gain: 0.05 },
      { freq: 493.88, type: 'sawtooth', at: 0.15, dur: 1.4, gain: 0.045 },
      { freq: 587.33, type: 'sawtooth', at: 0.15, dur: 1.4, gain: 0.045 },
      { freq: 783.99, type: 'triangle', at: 0.15, dur: 1.6, gain: 0.08 },
    ]),
  /** エンディング（1〜27日目）：ポワーン */
  powan: () =>
    play([
      { freq: 523.25, to: 392, type: 'sine', dur: 0.9, gain: 0.14 },
      { freq: 659.25, to: 494, type: 'sine', at: 0.05, dur: 0.9, gain: 0.08 },
    ]),
  /** エンディング（28〜29日目）：ガーン */
  gaan: () =>
    play([
      { freq: 196, type: 'sawtooth', dur: 1.3, gain: 0.07 },
      { freq: 233.08, type: 'sawtooth', dur: 1.3, gain: 0.06 },
      { freq: 277.18, type: 'sawtooth', dur: 1.3, gain: 0.06 },
      { freq: 98, type: 'sine', dur: 1.3, gain: 0.15 },
    ]),
  /** エンディング（完走）：ファンファーレ */
  fanfare: () =>
    play([
      { freq: 523.25, type: 'square', dur: 0.12, gain: 0.05 },
      { freq: 523.25, type: 'square', at: 0.14, dur: 0.12, gain: 0.05 },
      { freq: 523.25, type: 'square', at: 0.28, dur: 0.12, gain: 0.05 },
      { freq: 698.46, type: 'square', at: 0.42, dur: 0.5, gain: 0.06 },
      { freq: 880, type: 'triangle', at: 0.42, dur: 0.9, gain: 0.08 },
      { freq: 1046.5, type: 'triangle', at: 0.62, dur: 1.0, gain: 0.08 },
    ]),
};

export type SoundName = 'powan' | 'gaan' | 'fanfare' | 'dosa' | 'jaan';

/** データ（config.json の groups[].sound・sounds）の名前で鳴らす */
export function playByName(name: string): void {
  if (name in sfx && name !== 'chalin') (sfx[name as SoundName] as () => void)();
}

/** n日目に着いたときの「チャリン」の回数（config.json の sounds.nextLevels） */
export function chalinCount(day: number, levels: readonly { fromDay: number; count: number }[]): number {
  let c = 1;
  for (const l of levels) if (day >= l.fromDay) c = l.count;
  return c;
}
