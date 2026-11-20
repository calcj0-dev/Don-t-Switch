// T-07：データの検査。壊したデータで止まる
import { describe, expect, it } from 'vitest';
import { assertData, dataProblems } from '../src/core/validate';
import { config, messagesByLocale } from '../src/data';

const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T;
const ja = messagesByLocale.ja;

describe('T-07 データの検査', () => {
  it('今のデータは問題なし', () => expect(dataProblems(config, ja)).toEqual([]));

  it('日記が29日分だと止まる', () => {
    const m = clone(ja);
    delete (m.diary as Record<string, unknown>).d30;
    expect(() => assertData(config, m)).toThrow(/diary/);
  });
  it('話す人の記号がないと止まる', () => {
    const m = clone(ja);
    m.diary.d5.speaker = 'nobody';
    expect(() => assertData(config, m)).toThrow(/d5/);
  });
  it('区分にすき間があると止まる', () => {
    const c = clone(config);
    c.groups[1]!.to = 18;
    expect(() => assertData(c, ja)).toThrow(/groups/);
  });
  it('区分が重なると止まる', () => {
    const c = clone(config);
    c.groups[1]!.to = 20;
    expect(() => assertData(c, ja)).toThrow(/groups/);
  });
  it('たとえの順番が違うと止まる', () => {
    const c = clone(config);
    [c.analogies[3], c.analogies[4]] = [c.analogies[4]!, c.analogies[3]!];
    expect(() => assertData(c, ja)).toThrow(/analogy/);
  });
  it('たとえの切り替わる日がずれると止まる', () => {
    const c = clone(config);
    c.analogies[2]!.fromDay = 9;
    expect(() => assertData(c, ja)).toThrow(/a_juice/);
  });
  it('現実版の期待値が違うと止まる', () => {
    const c = clone(config);
    c.reality.rows[0]!.expectTotal += 1;
    expect(() => assertData(c, ja)).toThrow(/reality r_5_22/);
  });
  it('まとめサイトのリンクが違うと止まる', () => {
    const c = clone(config);
    c.links.portal = 'https://example.com/';
    expect(() => assertData(c, ja)).toThrow(/portal/);
  });
});
