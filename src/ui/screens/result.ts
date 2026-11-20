// S5 結果（設計書 1.7・F-06・F-08）

import { gapToFull, groupFor, received } from '../../core/compound';
import { toReality } from '../../core/game';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import { postText } from '../../share/postText';
import { renderResultImage } from '../../share/resultImage';
import { canShareImage, openXIntent, saveImage, shareWithImage } from '../../share/share';
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

  // 結果画像は画面を開いたときに作っておく（共有はタップの中ですぐ呼ぶ必要があるため）
  let imageBlob: Blob | null = null;
  const save = button(t('result.save'), () => imageBlob && void saveImage(imageBlob), 'btn');
  save.disabled = true;
  void renderResultImage(sd).then((b) => {
    imageBlob = b;
    save.disabled = !b;
  });
  const share = button(
    t('result.share'),
    () => {
      const text = postText(sd);
      if (matchMedia('(pointer: coarse)').matches && canShareImage(imageBlob)) void shareWithImage(text, imageBlob!);
      else openXIntent(text);
    },
    'btn btn-primary',
  );

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
