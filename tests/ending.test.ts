// エンディングの文を1文ずつに分ける（「」の中の「。」では分けない）
import { describe, expect, it } from 'vitest';
import { messagesByLocale } from '../src/data';
import { splitSentences } from '../src/ui/screens/ending';

describe('エンディングの1文ずつ', () => {
  it('g1 は3文', () => {
    expect(splitSentences(messagesByLocale.ja.endings.e_g1)).toEqual([
      '1億円を受け取った。',
      '大富豪「賢明だ」。',
      '翌月、ニュースで「1円が5億円に」という話を見て、そっとテレビを消した',
    ]);
  });
  it('どの文もつなげると元に戻る', () => {
    for (const s of Object.values(messagesByLocale.ja.endings)) expect(splitSentences(s).join('')).toBe(s);
  });
});
