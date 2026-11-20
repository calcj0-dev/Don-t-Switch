// S1 タイトル（設計書 2章・F-01）。右上にバージョンと音、まとめサイトへのリンク（共通の決まり C1・C2）

import { config } from '../../data';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, externalLink, h, linkButton } from '../dom';
import { soundButton, versionLabel } from '../parts';

export const titleScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const el = h('section', { className: 'screen screen-title' }, [
    h('div', { className: 'top-bar' }, [versionLabel(), sound.el]),
    h('div', { className: 'title-deco', attrs: { 'aria-hidden': 'true' }, text: t('title.deco') }),
    h('h1', { className: 'title', text: t('meta.name') }),
    h('p', { className: 'tagline', text: t('meta.tagline') }),
    button(
      t('title.start'),
      () => {
        session.reset();
        app.go('offer');
      },
      'btn btn-primary btn-start',
    ),
    h('nav', { className: 'link-row' }, [linkButton(t('title.how'), () => app.openModal('how')), linkButton(t('privacy.title'), () => app.openModal('privacy'))]),
    h('p', { className: 'note disclaimer-text', text: t('title.disclaimer') }),
    h('div', { className: 'title-links' }, [externalLink(t('title.portal'), config.links.portal), externalLink(t('title.credit'), config.links.follow)]),
  ]);
  return { el, unmount: sound.dispose };
};
