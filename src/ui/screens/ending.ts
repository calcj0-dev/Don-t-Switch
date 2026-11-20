// S4 エンディング（仮）。#4 でエンディング・結果・現実版を作るまでのつなぎ。
// いまは「何日目に乗り換えたか／30日間我慢したか」と称号・受け取った額だけを出す

import { groupFor, received } from '../../core/compound';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';

export const endingScreen: ScreenFactory = (app) => {
  const sd = session.game.switchDay;
  const g = groupFor(sd, config.groups);
  const el = h('section', { className: 'screen screen-ending' }, [
    h('div', { className: 'top-bar' }),
    h('p', { className: 'ending-title', text: t('result.titleLabel', { title: t(`titles.${g.titleId}` as MessageKey) }) }),
    h('p', { text: sd == null ? t('result.completed') : t('result.switchedOn', { day: sd }) }),
    h('p', { text: t('result.received', { yen: yen(received(sd, config)) }) }),
    button(t('result.retry'), () => app.go('title'), 'btn btn-primary btn-start'),
  ]);
  return { el };
};
