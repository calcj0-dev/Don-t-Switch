// 毎日の画面のグラフ（設計書 2.1・決定 #6）。
// 縦軸は1.2億円で固定。枠の上に余白を取り、28日目は1円側の線が1億円の線と枠を突き抜けてその余白に出る。
// 29・30日目は縦軸の上を広げ、0.5秒かけて縮めて見せる

import { bankOnDay, yenOnDay, type Bank } from '../core/compound';
import { yen } from '../format';
import { t } from '../i18n';

export type GraphCfg = { days: number; bank: Bank; switchAmount: number };
type View = { day: number; yMax: number; grow: number };

const HEADROOM = 40; // 枠の上の余白（突き抜けた線と矢印が出る所）
const FOOT = 22; // 下の目盛り（1日目・30日目）
const SIDE = 8;
const GROW_MS = 260;
const EXPAND_MS = 500;

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const ease = (x: number) => 1 - (1 - x) ** 3;

export function createDayGraph(cfg: GraphCfg): { el: HTMLCanvasElement; show(day: number, yMax: number): void; dispose(): void } {
  const el = document.createElement('canvas');
  el.className = 'graph';
  el.setAttribute('role', 'img');

  let shown: View | null = null;
  let raf = 0;

  const draw = (v: View) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: W, height: H } = el.getBoundingClientRect();
    if (W === 0 || H === 0) {
      // まだ画面に置かれていない：置かれてから描く
      raf = requestAnimationFrame(() => shown && draw(shown));
      return;
    }
    if (el.width !== Math.round(W * dpr)) el.width = Math.round(W * dpr);
    if (el.height !== Math.round(H * dpr)) el.height = Math.round(H * dpr);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const c = { line: css('--line'), sub: css('--text-sub'), gold: css('--gold'), bank: css('--bank'), text: css('--text') };
    const top = HEADROOM;
    const bottom = H - FOOT;
    const left = SIDE;
    const right = W - SIDE;
    const x = (n: number) => left + ((n - 1) / (cfg.days - 1)) * (right - left);
    const y = (val: number) => bottom - (val / v.yMax) * (bottom - top);
    const font = (px: number, bold = false) => `${bold ? '700 ' : ''}${px}px system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif`;

    // 枠
    ctx.strokeStyle = c.line;
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, right - left - 1, bottom - top - 1);

    // 1億円の目盛り
    const y1 = y(cfg.switchAmount);
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(left, y1);
    ctx.lineTo(right, y1);
    ctx.stroke();
    ctx.setLineDash([]);

    // 下の目盛り
    ctx.fillStyle = c.sub;
    ctx.font = font(11);
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText(t('day.label', { day: 1 }), left, H - 6);
    ctx.textAlign = 'right';
    ctx.fillText(t('day.label', { day: cfg.days }), right, H - 6);

    // 今日の分の線は grow（0〜1）だけ伸ばす
    const pts = (f: (n: number) => number) => {
      const p: [number, number][] = [];
      for (let n = 1; n <= v.day; n++) p.push([x(n), y(f(n))]);
      if (p.length >= 2 && v.grow < 1) {
        const a = p[p.length - 2]!;
        const b = p[p.length - 1]!;
        p[p.length - 1] = [a[0] + (b[0] - a[0]) * v.grow, a[1] + (b[1] - a[1]) * v.grow];
      }
      return p;
    };
    const stroke = (p: [number, number][], color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      p.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
      if (p.length === 1) ctx.lineTo(p[0]![0] + 0.01, p[0]![1]);
      ctx.stroke();
    };

    // 銀行の1億円（ほぼ横ばい）
    const bankPts = pts((n) => bankOnDay(n, cfg.bank));
    stroke(bankPts, c.bank, 2.5);
    ctx.fillStyle = c.sub;
    ctx.font = font(11);
    ctx.textAlign = 'left';
    ctx.fillText(t('day.oneOku'), left + 4, y1 - 6);
    ctx.fillText(t('day.bankLine', { yen: yen(bankOnDay(v.day, cfg.bank)) }), left + 4, y1 + 15);

    // 1円側（枠の上の余白まで描けるよう、切り取りはしない）
    const yenPts = pts(yenOnDay);
    stroke(yenPts, c.gold, 3.5);
    const end = yenPts[yenPts.length - 1]!;
    ctx.fillStyle = c.gold;
    ctx.beginPath();
    ctx.arc(end[0], Math.max(end[1], 2), 4, 0, Math.PI * 2);
    ctx.fill();

    const today = yenOnDay(v.day);
    if (today > v.yMax) {
      // 28日目：突き抜けた
      const ax = end[0];
      const ay = Math.max(end[1], 14);
      ctx.strokeStyle = c.gold;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(ax, ay - 2);
      ctx.lineTo(ax, 2);
      ctx.moveTo(ax - 6, 8);
      ctx.lineTo(ax, 2);
      ctx.lineTo(ax + 6, 8);
      ctx.stroke();
      ctx.fillStyle = c.text;
      ctx.font = font(15, true);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(t('day.reverse'), ax - 12, 16);
    } else {
      // 線の名前。地面に張り付いて見えないあいだは「ほぼ0に見える」
      const tiny = today / v.yMax < 0.03;
      ctx.fillStyle = c.gold;
      ctx.font = font(12, true);
      ctx.textBaseline = 'alphabetic';
      const label = t(tiny ? 'day.yenLineTiny' : 'day.yenLine');
      const nearRight = end[0] > (left + right) / 2;
      ctx.textAlign = nearRight ? 'right' : 'left';
      const lx = end[0] + (nearRight ? -8 : 8);
      const ly = tiny ? bottom - 8 : Math.max(end[1] - 8, top + 14);
      ctx.fillText(label, lx, ly);
    }
  };

  const show = (day: number, yMax: number) => {
    cancelAnimationFrame(raf);
    const from = shown && shown.day < day ? shown.yMax : yMax;
    const start = performance.now();
    const isNewDay = !shown || shown.day !== day;
    el.setAttribute('aria-label', `${t('day.yenLine')} ${yen(yenOnDay(day))} / ${t('day.bankLine', { yen: yen(bankOnDay(day, cfg.bank)) })}`);
    const tick = (now: number) => {
      const e = now - start;
      const grow = isNewDay && day > 1 ? Math.min(e / GROW_MS, 1) : 1;
      const k = from === yMax ? 1 : ease(Math.min(e / EXPAND_MS, 1));
      shown = { day, yMax: from + (yMax - from) * k, grow: ease(grow) };
      draw(shown);
      if (grow < 1 || k < 1) raf = requestAnimationFrame(tick);
    };
    tick(start);
  };

  const onResize = () => shown && draw(shown);
  window.addEventListener('resize', onResize);

  return {
    el,
    show,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    },
  };
}
