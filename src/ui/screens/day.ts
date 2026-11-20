// S3 毎日の画面（設計書 2章・2.1・2.2・F-03・F-04）。
// 画面は1回だけ組み立て、タップのたびに中身だけ書き換える（描き直しの途中のタップも捨てずに1日ずつ進む）

import { analogyFor, increaseOnDay, yMaxForDay, yenOnDay } from '../../core/compound';
import { canSwitch, pressNext, pressSwitch } from '../../core/game';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { h } from '../dom';
import { createDayGraph } from '../graph';
import { soundButton } from '../parts';

export const dayScreen: ScreenFactory = (app) => {
  const sound = soundButton();
  const graph = createDayGraph(config);

  const dayLabel = h('span', { className: 'day-label' });
  const amount = h('p', { className: 'amount' });
  const increase = h('p', { className: 'increase' });
  const analogy = h('p', { className: 'analogy' });
  const speaker = h('span', { className: 'diary-speaker', attrs: { 'aria-hidden': 'true' } });
  const diaryText = h('span', { className: 'diary-text' });
  const next = h('button', { className: 'btn btn-primary btn-next', attrs: { type: 'button' } });
  const switchBtn = h('button', { className: 'btn btn-switch', attrs: { type: 'button' }, text: t('day.switch') });

  const el = h('section', { className: 'screen screen-day' }, [
    h('div', { className: 'top-bar top-bar-day' }, [dayLabel, sound.el]),
    amount,
    increase,
    h('div', { className: 'graph-wrap' }, [graph.el]),
    analogy,
    h('p', { className: 'diary' }, [speaker, diaryText]),
    h('div', { className: 'actions' }, [next, switchBtn]),
  ]);

  let lastDayTimer = 0;
  const render = () => {
    const g = session.game;
    const d = g.day;
    const isLast = d === config.days;
    dayLabel.textContent = t('day.label', { day: d });
    amount.textContent = t('day.amount', { yen: yen(yenOnDay(d)) });
    increase.textContent = t('day.increase', { yen: yen(increaseOnDay(d)) });
    analogy.replaceChildren(
      h('span', { className: 'analogy-prefix', text: t('day.analogyPrefix') }),
      t(`analogies.${analogyFor(d, config.analogies).id}` as MessageKey),
    );
    speaker.textContent = t(`speakers.${t(`diary.d${d}.speaker` as MessageKey)}` as MessageKey);
    diaryText.textContent = t(`diary.d${d}.text` as MessageKey);
    next.textContent = t(isLast ? 'day.last' : 'day.next');
    switchBtn.style.visibility = canSwitch(g, config) ? 'visible' : 'hidden';
    el.classList.toggle('is-reverse', d === config.reverseDay);
    // 30日目に着いた直後は、連打の残りを捨てるあいだボタンを薄くする
    if (isLast && g.arrivedLastAt != null) {
      next.classList.add('is-cooling');
      clearTimeout(lastDayTimer);
      lastDayTimer = window.setTimeout(() => next.classList.remove('is-cooling'), Math.max(0, g.arrivedLastAt + config.lastDayGuardMs - performance.now()));
    }
    graph.show(d, yMaxForDay(d, config));
  };

  next.addEventListener('click', () => {
    const before = session.game;
    session.game = pressNext(before, performance.now(), config);
    if (session.game === before) return;
    if (session.game.phase === 'ending') app.go('ending');
    else render();
  });
  switchBtn.addEventListener('click', () => {
    const before = session.game;
    session.game = pressSwitch(before, config);
    if (session.game !== before) app.go('ending');
  });

  render();
  return {
    el,
    unmount: () => {
      clearTimeout(lastDayTimer);
      graph.dispose();
      sound.dispose();
    },
  };
};
