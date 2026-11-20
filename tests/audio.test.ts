// 効果音の回数（設計書 1.9）：1〜19日目は1回、20〜25日目は2回、26日目からは3回。区分の音の名前が実在する
import { describe, expect, it } from 'vitest';
import { chalinCount, sfx } from '../src/audio';
import { config } from '../src/data';

describe('効果音', () => {
  it('チャリンの回数', () => {
    const counts = Array.from({ length: 30 }, (_, i) => chalinCount(i + 1, config.sounds.nextLevels));
    expect(counts).toEqual([...Array(19).fill(1), ...Array(6).fill(2), ...Array(5).fill(3)]);
  });
  it('データの音の名前がすべてある', () => {
    for (const name of [...config.groups.map((g) => g.sound), config.sounds.switch, config.sounds.reverse, config.sounds.next]) {
      expect(Object.keys(sfx)).toContain(name === 'chalin' ? 'chalin' : name);
    }
  });
});
