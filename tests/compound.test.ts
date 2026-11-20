// T-01〜T-05：計算が設計の確かめ（sim/validate_result.md・sim/validate.mjs）と同じになる
import { describe, expect, it } from 'vitest';
import * as K from '../src/core/compound';
import { config as C, messagesByLocale } from '../src/data';
import { format } from '../src/i18n';
import { endingLines, table30 } from './helpers';

const J = messagesByLocale.ja;
const B = C.bank;
const fmt = (n: number) => n.toLocaleString('ja-JP');
const titleOf = (id: string) => (J.titles as Record<string, string>)[id];
const endingOf = (id: string) => (J.endings as Record<string, string>)[id] ?? '';
const analogyText = (id: string) => (J.analogies as Record<string, string>)[id];

describe('T-01 30日分の表', () => {
  const rows = table30();
  it('30行ある', () => expect(rows.map((r) => r.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1)));
  for (const r of rows) {
    it(`${r.day}日目`, () => {
      const g = K.groupFor(r.day === 30 ? null : r.day, C.groups);
      expect({
        yen: K.yenOnDay(r.day),
        inc: K.increaseOnDay(r.day),
        bank: K.bankOnDay(r.day, B),
        yMax: K.yMaxForDay(r.day, C),
        analogy: analogyText(K.analogyFor(r.day, C.analogies).id),
        groupId: g.id,
        title: titleOf(g.titleId),
      }).toEqual({ yen: r.yen, inc: r.inc, bank: r.bank, yMax: r.yMax, analogy: r.analogy, groupId: r.groupId, title: r.title });
    });
  }
});

describe('T-02 日記・エンディングの中の数字の検算（12項目）', () => {
  it('12日目「銀行で548円増えた」', () => expect(K.bankDailyInterest(B)).toBe(548));
  it('12日目「こっちは1,024円増えた」', () => expect(K.increaseOnDay(12)).toBe(1024));
  it('11日目「初めて千円を超えた」', () => expect(K.yenOnDay(11) > 1000 && K.yenOnDay(10) < 1000).toBe(true));
  it('15日目「8,000円くらい増えた」', () => {
    const i = K.bankInterest(15, B);
    expect(i >= 7500 && i < 8500).toBe(true);
  });
  it('15日目「やっと1万円を超えた」', () => expect(K.yenOnDay(15) > 10000 && K.yenOnDay(14) < 10000).toBe(true));
  it('17日目「あと9,993万円」', () => expect(Math.round((1e8 - K.yenOnDay(17)) / 1e4)).toBe(9993));
  it('21日目「100万円を超えた／1%」', () => expect(K.yenOnDay(21) > 1e6 && K.yenOnDay(21) / 1e8 < 0.011).toBe(true));
  it('27日目「あと3,289万円」', () => expect(Math.round((1e8 - K.yenOnDay(27)) / 1e4)).toBe(3289));
  it('28日目「超えた」', () => expect(K.yenOnDay(28) > 1e8 && K.yenOnDay(27) < 1e8 && C.reverseDay === 28).toBe(true));
  it('30日目「利息は1.6万円」', () => expect(Math.round(K.bankInterest(30, B) / 1000) / 10).toBe(1.6));
  it('30日目「5億3,687万円」', () => expect(K.toOkuMan(K.yenOnDay(30))).toBe('5億3,687万円'));
  it('現実版「積立は約2倍、結果は約3.5倍の差」', () => {
    const r = C.reality.rows.map((x) => K.reality(C.reality.monthly, x.rate, x.startAge, C.reality.endAge));
    expect(Math.round(r[0]!.deposited / r[1]!.deposited)).toBe(2);
    expect(Math.round((r[0]!.total / r[1]!.total) * 10) / 10).toBe(3.5);
  });
});

describe('T-03 区分・称号・エンディング・差し込み値', () => {
  const lines = endingLines();
  // [乗り換えた日（完走は null）, 区分, validate_result.md「4.」の行（なければ ''）]
  const cases: [number | null, string, string][] = [
    [1, 'g1', '1'],
    [10, 'g1', '10'],
    [11, 'g2', ''],
    [19, 'g2', ''],
    [20, 'g3', ''],
    [22, 'g3', '22'],
    [24, 'g3', ''],
    [25, 'g4', '25'],
    [27, 'g4', '27'],
    [28, 'g5', '28'],
    [29, 'g5', '29'],
    [null, 'g6', '完走'],
  ];
  it('確かめの結果に8行ある', () => expect(lines.size).toBe(8));
  for (const [sd, gid, key] of cases) {
    it(`${sd ?? '完走'}`, () => {
      const g = K.groupFor(sd, C.groups);
      expect(g.id).toBe(gid);
      expect(titleOf(g.titleId)).toBeTruthy();
      const v = K.endingVars(sd, C);
      const ending = format(endingOf(g.endingId), {
        ...(v.daysToReverse != null ? { daysToReverse: v.daysToReverse } : {}),
        ...(v.overYen != null ? { overYen: fmt(v.overYen) } : {}),
      });
      expect(ending).not.toMatch(/\{\w+\}/);
      if (key) expect({ received: K.received(sd, C), gap: K.gapToFull(sd, C), ending }).toEqual(lines.get(key));
    });
  }
});

describe('T-04 絵文字30マス', () => {
  const k = '🟩'.repeat(10);
  const w = '⬜'.repeat(10);
  it('1日目', () => expect(K.emojiGrid(1, C, C.emoji)).toBe(['💴' + '⬜'.repeat(9), w, w].join('\n')));
  it('22日目', () => expect(K.emojiGrid(22, C, C.emoji)).toBe([k, k, '🟩💴' + '⬜'.repeat(8)].join('\n')));
  it('29日目', () => expect(K.emojiGrid(29, C, C.emoji)).toBe([k, k, '🟩'.repeat(8) + '💴⬜'].join('\n')));
  it('完走', () => expect(K.emojiGrid(null, C, C.emoji)).toBe([k, k, k].join('\n')));
});

describe('T-05 現実版', () => {
  for (const r of C.reality.rows) {
    it(r.id, () =>
      expect(K.reality(C.reality.monthly, r.rate, r.startAge, C.reality.endAge)).toEqual({ total: r.expectTotal, deposited: r.expectDeposited }),
    );
  }
  it('万円表記', () => expect(C.reality.rows.map((r) => K.toMan(r.expectTotal))).toEqual(['5,456万円', '1,555万円', '1,617万円']));
});
