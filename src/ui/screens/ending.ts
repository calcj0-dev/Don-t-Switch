// S4 エンディング（設計書 1.6・F-05）。区分の文を1文ずつゆっくり出す。画面をタップすると残りをすぐ出す

import { endingVars, groupFor } from '../../core/compound';
import { toResult } from '../../core/game';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { button, h } from '../dom';
import { soundButton } from '../parts';

const LINE_MS = 900;

/** 「。」で区切って1文ずつにする（「」の中の「。」では区切らない） */
export function splitSentences(text: string): string[] {
  const out: string[] = [];
  let buf = '';
  let depth = 0;
  for (const ch of text) {
    buf += ch;
    if (ch === '「') depth++;
    else if (ch === '」') depth = Math.max(0, depth - 1);
    else if (ch === '。' && depth === 0) {
      out.push(buf);
      buf = '';
    }
  }
  if (buf) out.push(buf);
  return out;
}

export const endingScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const sd = session.game.switchDay;
  const g = groupFor(sd, config.groups);
  const v = endingVars(sd, config);
  const text = t(`endings.${g.endingId}` as MessageKey, {
    ...(v.daysToReverse != null ? { daysToReverse: v.daysToReverse } : {}),
    ...(v.overYen != null ? { overYen: yen(v.overYen) } : {}),
  });

  const lines = splitSentences(text).map((s) => h('p', { className: 'ending-line', text: s }));
  const toResultBtn = button(
    t('ending.toResult'),
    () => {
      session.game = toResult(session.game);
      app.go('result');
    },
    'btn btn-primary btn-start ending-next',
  );

  const el = h('section', { className: 'screen screen-ending' }, [
    h('div', { className: 'top-bar' }, [sound.el]),
    h('p', { className: 'ending-head', text: sd == null ? t('result.completed') : t('result.switchedOn', { day: sd }) }),
    h('div', { className: 'ending-lines' }, lines),
    toResultBtn,
  ]);

  // 1文ずつ出す
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const timers: number[] = [];
  const showAll = () => {
    for (const id of timers) clearTimeout(id);
    for (const l of lines) l.classList.add('is-shown');
    toResultBtn.classList.add('is-shown');
  };
  if (reduce) showAll();
  else {
    lines.forEach((l, i) => timers.push(window.setTimeout(() => l.classList.add('is-shown'), 300 + i * LINE_MS)));
    timers.push(window.setTimeout(showAll, 300 + lines.length * LINE_MS));
    el.addEventListener('click', (e) => {
      if (e.target !== toResultBtn) showAll();
    });
  }

  return {
    el,
    unmount: () => {
      for (const id of timers) clearTimeout(id);
      sound.dispose();
    },
  };
};
