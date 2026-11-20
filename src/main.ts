// 入口。#1 の時点ではタイトルの仮の画面（名前・一言・右上のバージョン）だけを出す

import './style.css';
import { setLocale, t } from './i18n';
import { h } from './ui/dom';
import { APP_VERSION } from './version';

setLocale('ja');
document.title = t('meta.name');

const root = document.querySelector<HTMLElement>('#app');
if (root) {
  root.replaceChildren(
    h('section', { className: 'screen screen-title' }, [
      h('div', { className: 'top-bar' }, [h('span', { className: 'version', text: t('title.version', { version: APP_VERSION }) })]),
      h('h1', { className: 'title', text: t('meta.name') }),
      h('p', { className: 'tagline', text: t('meta.tagline') }),
    ]),
  );
}
