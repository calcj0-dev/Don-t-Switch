import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

// バージョンは package.json の1か所で持ち、ビルド時に埋め込む（共通の決まり C1・設計書 5.7）
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8')) as { version: string };
// 作品のURLは data/config.json の links.site の1か所（URL を貼ったときのカードは絶対URLが要る）
const cfg = JSON.parse(readFileSync(new URL('./src/data/config.json', import.meta.url), 'utf-8')) as { links: { site: string } };

export default defineConfig({
  // どこに置いても動くよう相対パスにする（設計書 5.1）
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', cfg.links.site),
    },
  ],
  test: {
    include: ['tests/**/*.test.ts'],
  },
});
