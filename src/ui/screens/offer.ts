// S2 申し出（設計書 2章・F-02）

import { accept } from '../../core/game';
import { t } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';
import { soundButton } from '../parts';

export const offerScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const el = h('section', { className: 'screen screen-offer' }, [
    h('div', { className: 'top-bar' }, [sound.el]),
    h('div', { className: 'offer-icon', attrs: { 'aria-hidden': 'true' }, text: t('speakers.rich') }),
    h('div', { className: 'offer-lines' }, [
      h('p', { text: t('offer.line1') }),
      h('p', { className: 'offer-quote', text: t('offer.line2') }),
      h('p', { className: 'offer-quote', text: t('offer.line3') }),
      h('p', { text: t('offer.line4') }),
    ]),
    button(
      t('offer.button'),
      () => {
        session.game = accept(session.game);
        app.go('day');
      },
      'btn btn-primary btn-start',
    ),
  ]);
  return { el, unmount: sound.dispose };
};
