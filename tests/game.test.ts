// T-06：日の進み方。連打で飛ばさない・取りこぼさない。30日目で止まり、乗り換えボタンがない
import { describe, expect, it } from 'vitest';
import { accept, canSwitch, newGame, pressNext, pressSwitch, toReality, toResult, type Game } from '../src/core/game';
import { config as R } from '../src/data';

const tap = (g: Game, times: number, now = 0): Game => {
  for (let i = 0; i < times; i++) g = pressNext(g, now, R);
  return g;
};

describe('T-06 進み方', () => {
  it('1タップ＝1日（取りこぼさない・飛ばさない）', () => {
    let g = accept(newGame());
    expect(g.day).toBe(1);
    for (let d = 2; d <= 30; d++) {
      g = pressNext(g, 0, R);
      expect(g.day).toBe(d);
    }
  });
  it('速く何回押しても30日目で止まる（連打の残りで受け取らない）', () => {
    expect(tap(accept(newGame()), 100, 1000)).toMatchObject({ day: 30, phase: 'day', switchDay: null });
  });
  it('30日目に着いてから少し待って押すと受け取る（完走）', () => {
    let g = tap(accept(newGame()), 29, 1000);
    g = pressNext(g, 1000 + R.lastDayGuardMs - 1, R);
    expect(g.phase).toBe('day');
    g = pressNext(g, 1000 + R.lastDayGuardMs, R);
    expect(g).toMatchObject({ phase: 'ending', switchDay: null, day: 30 });
  });
  it('30日目に乗り換えボタンがない', () => {
    const g = tap(accept(newGame()), 29);
    expect(canSwitch(g, R)).toBe(false);
    expect(pressSwitch(g, R)).toBe(g);
  });
  it('29日目までは乗り換えられ、確認なしでその場で決まる', () => {
    for (const d of [1, 22, 29]) {
      expect(pressSwitch(tap(accept(newGame()), d - 1), R)).toMatchObject({ phase: 'ending', switchDay: d });
    }
  });
  it('申し出の前と、決まった後は「次の日へ」が効かない', () => {
    expect(pressNext(newGame(), 0, R).day).toBe(1);
    const ended = pressSwitch(tap(accept(newGame()), 4), R);
    expect(pressNext(ended, 0, R)).toBe(ended);
  });
  it('エンディング → 結果 → 現実版', () => {
    expect(toReality(toResult(pressSwitch(accept(newGame()), R))).phase).toBe('reality');
  });
});
