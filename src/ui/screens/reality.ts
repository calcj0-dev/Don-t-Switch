// S6 現実版（設計書 1.8・決定 #9・F-07）。数字は開くたびに計算する（データの検査で expectTotal と同じことを確かめ済み）

import { reality } from '../../core/compound';
import { config } from '../../data';
import { toMan } from '../../format';
import { t, type MessageKey } from '../../i18n';
import type { ScreenFactory } from '../app';
import { button, externalLink, h } from '../dom';
import { soundButton, topBar } from '../parts';
import { retry } from './retry';

export const realityScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const r = config.reality;
  const rows = r.rows.map((row) => ({ row, v: reality(r.monthly, row.rate, row.startAge, r.endAge) }));
  const max = Math.max(...rows.map((x) => x.v.total));
  const pct = (n: number) => `${((n / max) * 100).toFixed(2)}%`;

  const bar = (className: string, width: string) => {
    const el = h('div', { className });
    el.style.width = width;
    return el;
  };

  const bars = rows.map(({ row, v }) =>
    h('div', { className: `bar-row ${row.rate < 0.01 ? 'is-bank' : ''}` }, [
      h('p', { className: 'bar-label', text: t(`reality.rows.${row.id}` as MessageKey) }),
      h('div', { className: 'bar-track' }, [
        bar('bar-total', pct(v.total)),
        bar('bar-deposited', pct(v.deposited)),
      ]),
      h('p', { className: 'bar-values' }, [
        h('span', { className: 'bar-value', text: t('reality.total', { man: toMan(v.total) }) }),
        h('span', { className: 'bar-dep', text: t('reality.deposited', { yen: toMan(v.deposited) }) }),
      ]),
    ]),
  );

  const app1 = (name: MessageKey, note: MessageKey | null, href: string) =>
    h('div', { className: 'app-card' }, [note && h('p', { className: 'app-note', text: t(note) }), externalLink(t(name), href)]);

  const el = h('section', { className: 'screen screen-reality' }, [
    topBar(app, sound.el),
    h('p', { className: 'reality-lead' }, [h('span', { className: 'speaker', text: t('speakers.rich') }), t('reality.lead')]),
    h('p', { className: 'reality-premise', text: t('reality.premise') }),
    h('div', { className: 'bars card' }, bars),
    h('p', { className: 'reality-punch', text: t('reality.punch') }),
    h('p', { className: 'reality-sub', text: t('reality.punchSub') }),
    h('div', { className: 'apps' }, [
      h('p', { className: 'apps-heading', text: t('reality.apps') }),
      app1('reality.tameru', 'reality.tameruNote', config.links.tameru),
      app1('reality.portal', null, config.links.portal),
    ]),
    button(t('result.retry'), () => retry(app), 'btn btn-primary btn-start'),
    h('div', { className: 'page-links' }, [externalLink(t('reality.follow'), config.links.follow)]),
    h('p', { className: 'note reality-note', text: t('reality.note') }),
  ]);
  return { el, unmount: sound.dispose };
};
