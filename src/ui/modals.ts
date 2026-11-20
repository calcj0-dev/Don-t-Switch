// M1 遊び方・M2 プライバシー（設計書 2章）

import { t, type MessageKey } from '../i18n';
import type { ModalFactory, ModalName } from './app';
import { button, h } from './dom';

const simple =
  (heading: MessageKey, body: MessageKey): ModalFactory =>
  (app) =>
    h('div', { className: 'modal-panel' }, [
      h('h2', { className: 'heading', text: t(heading) }),
      h('p', { className: 'modal-body', text: t(body) }),
      button(t('common.close'), () => app.closeModal(), 'btn'),
    ]);

export const modals: Record<ModalName, ModalFactory> = {
  how: simple('title.how', 'how.body'),
  privacy: simple('privacy.title', 'privacy.body'),
};
