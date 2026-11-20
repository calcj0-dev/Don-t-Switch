// 入口

import './style.css';
import { accept, pressNext } from './core/game';
import { config } from './data';
import { setLocale, t } from './i18n';
import { session } from './session';
import { createApp } from './ui/app';
import { modals } from './ui/modals';
import { dayScreen } from './ui/screens/day';
import { endingScreen } from './ui/screens/ending';
import { offerScreen } from './ui/screens/offer';
import { titleScreen } from './ui/screens/title';

setLocale('ja');
document.title = t('meta.name');

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  const app = createApp(root, { title: titleScreen, offer: offerScreen, day: dayScreen, ending: endingScreen }, modals);
  app.go('title');

  // 開発用：?day=27 でその日の画面を直接開く（公開版では無視する）
  if (import.meta.env.DEV) {
    const day = Number(new URLSearchParams(location.search).get('day'));
    if (day >= 1 && day <= config.days) {
      let g = accept(session.game);
      for (let d = 1; d < day; d++) g = pressNext(g, -1e9, config);
      session.game = g;
      app.go('day');
    }
  }
}
