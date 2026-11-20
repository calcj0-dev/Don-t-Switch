// S5 結果（設計書 1.7・F-06）。シェアと画像の保存は #5 でつなぐ（いまは押せない）

import { gapToFull, groupFor, received } from '../../core/compound';
import { toReality } from '../../core/game';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, externalLink, h } from '../dom';
import { soundButton } from '../parts';
import { resultGraphCanvas } from '../resultGraph';
import { retry } from './retry';

export const resultScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const sd = session.game.switchDay;
  const g = groupFor(sd, config.groups);
  const graph = resultGraphCanvas(sd, config);

  const share = button(t('result.share'), () => {}, 'btn btn-primary');
  const save = button(t('result.save'), () => {}, 'btn');
  share.disabled = true;
  save.disabled = true;

  const el = h('section', { className: 'screen screen-result' }, [
    h('div', { className: 'top-bar' }, [sound.el]),
    h('p', { className: 'result-heading', text: t('result.heading') }),
    h('h1', { className: 'result-title', text: t('result.titleLabel', { title: t(`titles.${g.titleId}` as MessageKey) }) }),
    h('div', { className: 'result-facts' }, [
      h('p', { className: 'result-day', text: sd == null ? t('result.completed') : t('result.switchedOn', { day: sd }) }),
      h('p', { text: t('result.received', { yen: yen(received(sd, config)) }) }),
      h('p', { className: 'result-gap', text: sd == null ? t('result.gapZero') : t('result.gap', { gap: yen(gapToFull(sd, config)) }) }),
    ]),
    h('div', { className: 'graph-wrap' }, [graph.el]),
    h('div', { className: 'result-actions' }, [
      h('div', { className: 'result-share-row' }, [share, save]),
      button(
        t('result.toReality'),
        () => {
          session.game = toReality(session.game);
          app.go('reality');
        },
        'btn btn-reality',
      ),
      button(t('result.retry'), () => retry(app), 'btn'),
    ]),
    h('div', { className: 'page-links' }, [externalLink(t('title.portal'), config.links.portal)]),
  ]);
  return {
    el,
    unmount: () => {
      graph.dispose();
      sound.dispose();
    },
  };
};
