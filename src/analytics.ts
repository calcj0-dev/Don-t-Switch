// 計測（2026-11-20 決定）：Vercel Analytics のページの表示数だけ。イベントは送らない。開発中は送らない

import { inject } from '@vercel/analytics';

export function initAnalytics(): void {
  if (import.meta.env.PROD) inject({ mode: 'production', framework: 'vanilla' });
}
