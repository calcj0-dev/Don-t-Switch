// データの検査（設計書 4章。sim/validate.mjs の「1.」と同じ内容）。おかしければ理由をすべて並べて止める

import { analogyFor, reality, yenOnDay, type Analogy, type Group } from './compound';

export type CheckedConfig = {
  days: number;
  startYen: number;
  multiplier: number;
  groups: readonly Group[];
  analogies: readonly Analogy[];
  reality: {
    monthly: number;
    endAge: number;
    rows: readonly { id: string; rate: number; startAge: number; expectTotal: number; expectDeposited: number }[];
  };
  links: { portal: string };
};
export type CheckedMessages = {
  speakers: Record<string, string>;
  diary: Record<string, { speaker: string; text: string }>;
  titles: Record<string, string>;
  endings: Record<string, string>;
  analogies: Record<string, string>;
  reality: { rows: Record<string, string> };
};

const PORTAL = 'https://app-lab-rust.vercel.app';

export function dataProblems(c: CheckedConfig, m: CheckedMessages): string[] {
  const p: string[] = [];
  if (!(c.days === 30 && c.startYen === 1 && c.multiplier === 2)) p.push('days/startYen/multiplier must be 30/1/2');

  if (Object.keys(m.diary).length !== c.days) p.push(`diary must have ${c.days} entries`);
  for (let n = 1; n <= c.days; n++) {
    const d = m.diary[`d${n}`];
    if (!d || !d.text || !m.speakers[d.speaker]) p.push(`diary d${n} is missing text or speaker`);
  }

  const cover = Array<number>(c.days + 1).fill(0);
  for (const g of c.groups) for (let d = g.from; d <= g.to; d++) cover[d] = (cover[d] ?? 0) + 1;
  if (!cover.slice(1).every((x) => x === 1) || cover.length !== c.days + 1) p.push('groups must cover days 1..30 without gaps or overlaps');
  for (const g of c.groups) if (!m.titles[g.titleId] || !m.endings[g.endingId]) p.push(`group ${g.id} is missing title or ending text`);

  for (const a of c.analogies) {
    const hit = analogyFor(a.fromDay, c.analogies).id === a.id;
    const prevNot = a.fromDay === 1 || analogyFor(a.fromDay - 1, c.analogies).id !== a.id;
    if (!hit || !prevNot) p.push(`analogy ${a.id} does not switch exactly on day ${a.fromDay}`);
    if (!m.analogies[a.id]) p.push(`analogy ${a.id} has no text`);
  }

  for (const r of c.reality.rows) {
    const v = reality(c.reality.monthly, r.rate, r.startAge, c.reality.endAge);
    if (v.total !== r.expectTotal || v.deposited !== r.expectDeposited) p.push(`reality ${r.id} does not match expectTotal/expectDeposited`);
    if (!m.reality.rows[r.id]) p.push(`reality ${r.id} has no text`);
  }

  if (!c.links.portal.startsWith(PORTAL)) p.push(`links.portal must start with ${PORTAL}`);
  if (yenOnDay(c.days) > Number.MAX_SAFE_INTEGER) p.push('day 30 amount is not a safe integer');
  return p;
}

export function assertData(c: CheckedConfig, m: CheckedMessages): void {
  const p = dataProblems(c, m);
  if (p.length) throw new Error(`invalid data:\n- ${p.join('\n- ')}`);
}
