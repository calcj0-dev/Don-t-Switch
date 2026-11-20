// 投稿文（設計書 5.5）：sim/validate_result.md の例から絵文字30マスの行を除いたものと同じになる（2026-11-20 決定）。X の投稿画面では改行が %0A になる
import { describe, expect, it } from 'vitest';
import { postText } from '../src/share/postText';
import { shareUrl, xIntentUrl } from '../src/share/share';
import { validateResult } from './helpers';

const examples = [...validateResult.matchAll(/```\n([\s\S]*?)\n```/g)].map((m) =>
  m[1]!
    .replace(/\r/g, '')
    .split('\n')
    .filter((l) => !/^[🟩💴⬜]+$/u.test(l))
    .join('\n'),
);

describe('投稿文', () => {
  it('確かめの結果に例が2つある', () => expect(examples).toHaveLength(2));
  it('22日目に乗り換え', () => expect(postText(22)).toBe(examples[0]));
  it('完走', () => expect(postText(null)).toBe(examples[1]));
  it('29日目は「あと1日」', () => expect(postText(29)).toContain('29日目に1億円に乗り換えた。あと1日で'));
  it('30マスが入らない', () => {
    for (const sd of [1, 22, 29, null]) expect(postText(sd)).not.toMatch(/[🟩💴⬜]/u);
  });
  it('X の投稿画面のURL', () => {
    const u = xIntentUrl(postText(22));
    expect(u.startsWith('https://x.com/intent/post?text=')).toBe(true);
    expect(u).toContain('%0A');
    expect(u).toContain(`&url=${encodeURIComponent(shareUrl())}`);
  });
});
