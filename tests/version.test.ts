// 共通の決まり C1：バージョンは package.json の1か所だけ。0.1.0 から始める
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { t } from '../src/i18n';
import { APP_VERSION } from '../src/version';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8')) as { version: string };

describe('バージョン', () => {
  it('package.json の値が画面用に埋め込まれる', () => {
    expect(APP_VERSION).toBe(pkg.version);
  });
  it('「v0.1.0」の形で出す', () => {
    expect(t('title.version', { version: '0.1.0' })).toBe('v0.1.0');
  });
});
