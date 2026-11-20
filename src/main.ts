// 入口

import './style.css';
import { accept, pressNext, pressSwitch, toReality, toResult } from './core/game';
import { config } from './data';
import { setLocale, t } from './i18n';
import { session } from './session';
import { createApp } from './ui/app';
import { modals } from './ui/modals';
import { dayScreen } from './ui/screens/day';
import { endingScreen } from './ui/screens/ending';
import { offerScreen } from './ui/screens/offer';
import { realityScreen } from './ui/screens/reality';
import { resultScreen } from './ui/screens/result';
import { titleScreen } from './ui/screens/title';

setLocale('ja');
document.title = t('meta.name');

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const app = createApp(
    root,
    { title: titleScreen, offer: offerScreen, day: dayScreen, ending: endingScreen, result: resultScreen, reality: realityScreen },
    modals,
  );
  app.go('title');

  // 開発用（公開版では無視する）：?day=27 でその日の画面、?end=22&to=result で乗り換え後の画面（end=30 は完走）
  if (import.meta.env.DEV) {
    const q = new URLSearchParams(location.search);
    const day = Number(q.get('day') ?? q.get('end'));
    if (day >= 1 && day <= config.days) {
      let g = accept(session.game);
      for (let d = 1; d < day; d++) g = pressNext(g, -1e9, config);
      if (q.has('end')) {
        g = day === config.days ? pressNext(g, 0, config) : pressSwitch(g, config);
        const to = q.get('to');
        if (to === 'result' || to === 'reality') g = toResult(g);
        if (to === 'reality') g = toReality(g);
        session.game = g;
        app.go(to === 'result' || to === 'reality' ? to : 'ending');
      } else {
        session.game = g;
        app.go('day');
      }
    }
  }
}
