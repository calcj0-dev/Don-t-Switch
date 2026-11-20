// M1 遊び方・M2 プライバシー（設計書 2章・5.6）

import { config } from '../data';
import { t, type MessageKey } from '../i18n';
import type { ModalFactory, ModalName } from './app';
import { button, externalLink, h } from './dom';

const panel =
  (heading: MessageKey, body: () => (HTMLElement | string)[]): ModalFactory =>
  (app) =>
    h('div', { className: 'modal-panel' }, [
      h('h2', { className: 'heading', text: t(heading) }),
      h('div', { className: 'modal-body' }, body()),
      button(t('common.close'), () => app.closeModal(), 'btn'),
    ]);

export const modals: Record<ModalName, ModalFactory> = {
  how: panel('title.how', () => [h('p', { text: t('how.body') })]),
  privacy: panel('privacy.title', () => [
    ...(['privacy.p1', 'privacy.p2', 'privacy.p3', 'privacy.p4'] as const).map((k) => h('p', { text: t(k) })),
    externalLink(t('privacy.vercelPolicy'), config.links.vercelPrivacy),
  ]),
  // 毎日の画面で「← タイトル」を押したとき。続ける方を目立たせる
  confirmTitle: (app) =>
    h('div', { className: 'modal-panel' }, [
      h('p', { className: 'modal-body confirm-text', text: t('common.confirmTitle') }),
      button(t('common.confirmNo'), () => app.closeModal(), 'btn btn-primary'),
      button(t('common.confirmYes'), () => app.go('title'), 'btn'),
    ]),
};
