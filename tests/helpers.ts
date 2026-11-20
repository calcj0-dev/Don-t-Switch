// テストの道具：sim/validate_result.md（設計の確かめの結果）を読む
import { readFileSync } from 'node:fs';

export const validateResult = readFileSync(new URL('../sim/validate_result.md', import.meta.url), 'utf-8');

const num = (s: string) => Number(s.replace(/[+,]/g, ''));

/** 「## 3. 30日分の表」の行 */
export function table30(): { day: number; yen: number; inc: number; bank: number; yMax: number; analogy: string; groupId: string; title: string }[] {
  return validateResult
    .split('\n')
    .filter((l) => /^\| \d+ \|/.test(l))
    .map((l) => {
      const c = l.split('|').slice(1, -1).map((x) => x.trim());
      const [groupId = '', ...title] = (c[6] ?? '').split(' ');
      return { day: num(c[0]!), yen: num(c[1]!), inc: num(c[2]!), bank: num(c[3]!), yMax: num(c[4]!), analogy: c[5]!, groupId, title: title.join(' ') };
    });
}

/** 「## 4.」の「- 22：受け取り …／差 …／エンディング」の行 */
export function endingLines(): Map<string, { received: number; gap: number; ending: string }> {
  const map = new Map<string, { received: number; gap: number; ending: string }>();
  for (const l of validateResult.split('\n')) {
    const m = /^- (\d+|完走)：受け取り ([\d,]+)円／差 ([\d,]+)円／(.+)$/.exec(l.trimEnd());
    if (m) map.set(m[1]!, { received: num(m[2]!), gap: num(m[3]!), ending: m[4]! });
  }
  return map;
}
