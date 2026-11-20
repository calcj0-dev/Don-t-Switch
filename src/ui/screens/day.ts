// S3 毎日の画面（設計書 2章・2.1・2.2・F-03・F-04）。
// 画面は1回だけ組み立て、タップのたびに中身だけ書き換える（描き直しの途中のタップも捨てずに1日ずつ進む）

import { chalinCount, playByName, sfx } from '../../audio';
import { analogyFor, increaseOnDay, yMaxForDay, yenOnDay } from '../../core/compound';
import { canSwitch, pressNext, pressSwitch } from '../../core/game';
import { config } from '../../data';
import { yen } from '../../format';
import { t, type MessageKey } from '../../i18n';
import { session } from '../../session';
import type { ScreenFactory } from '../app';
import { h } from '../dom';
import { createDayGraph } from '../graph';
import { soundButton, topBar } from '../parts';

const COUNT_MS = 380;

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
  // 30日分の進み具合（手帳の見出しの横に並べる点）
  const dots = Array.from({ length: config.days }, () => h('span', { className: 'dot' }));

  const el = h('section', { className: 'screen screen-day' }, [
    topBar(app, sound.el, true),
    h('div', { className: 'day-head' }, [dayLabel, h('div', { className: 'dots', attrs: { 'aria-hidden': 'true' } }, dots)]),
    h('div', { className: 'amount-box' }, [amount, increase]),
    h('div', { className: 'graph-wrap card' }, [graph.el]),
    h('div', { className: 'page diary-page' }, [analogy, h('p', { className: 'diary' }, [speaker, diaryText])]),
    h('div', { className: 'actions' }, [next, switchBtn]),
  ]);

  let lastDayTimer = 0;
  // 額のカウントアップ。連打のときは、いま見えている数字から次の額へ
  let shownYen = 0;
  let countRaf = 0;
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const countTo = (target: number) => {
    cancelAnimationFrame(countRaf);
    const from = shownYen;
    const start = performance.now();
    const step = (now: number) => {
      const k = reduce || from >= target ? 1 : Math.min((now - start) / COUNT_MS, 1);
      shownYen = Math.round(from + (target - from) * (1 - (1 - k) ** 3));
      amount.textContent = t('day.amount', { yen: yen(shownYen) });
      if (k < 1) countRaf = requestAnimationFrame(step);
    };
    step(start);
  };
  const render = () => {
    const g = session.game;
    const d = g.day;
    const isLast = d === config.days;
    dayLabel.textContent = t('day.label', { day: d });
    countTo(yenOnDay(d));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-done', i + 1 < d);
      dot.classList.toggle('is-today', i + 1 === d);
    });
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
    if (session.game.phase === 'ending') {
      app.go('ending');
      return;
    }
    const d = session.game.day;
    sfx.chalin(chalinCount(d, config.sounds.nextLevels), d);
    if (d === config.reverseDay) playByName(config.sounds.reverse);
    render();
  });
  switchBtn.addEventListener('click', () => {
    const before = session.game;
    session.game = pressSwitch(before, config);
    if (session.game !== before) {
      playByName(config.sounds.switch);
      app.go('ending');
    }
  });

  render();
  return {
    el,
    unmount: () => {
      clearTimeout(lastDayTimer);
      cancelAnimationFrame(countRaf);
      graph.dispose();
      sound.dispose();
    },
  };
};
