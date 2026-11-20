// 結果のグラフ（設計書 1.7）：30日分の2本の線。縦軸は6億円まで。乗り換えた日に 💴、
// 乗り換えた後の1円側は薄い点線（もし続けていたら）。結果画像（#5）でも同じ図を描けるよう、描く先と大きさを受け取る

import { bankOnDay, yenOnDay, type Bank } from '../core/compound';
import { t } from '../i18n';

export type ResultGraphCfg = {
  days: number;
  bank: Bank;
  switchAmount: number;
  graph: { resultYMax: number };
  emoji: { switch: string };
};
export type ResultGraphColors = { line: string; sub: string; gold: string; bank: string };

const FONT = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';

export function drawResultGraphOn(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  switchDay: number | null,
  cfg: ResultGraphCfg,
  c: ResultGraphColors,
  scale = 1,
): void {
  const top = 28 * scale;
  const bottom = H - 22 * scale;
  const left = 8 * scale;
  const right = W - 8 * scale;
  const yMax = cfg.graph.resultYMax;
  const x = (n: number) => left + ((n - 1) / (cfg.days - 1)) * (right - left);
  const y = (v: number) => bottom - (v / yMax) * (bottom - top);
  const font = (px: number, bold = false) => `${bold ? '700 ' : ''}${px * scale}px ${FONT}`;

  // 枠と1億円の目盛り
  ctx.strokeStyle = c.line;
  ctx.lineWidth = 1 * scale;
  ctx.strokeRect(left, top, right - left, bottom - top);
  const y1 = y(cfg.switchAmount);
  ctx.setLineDash([4 * scale, 4 * scale]);
  ctx.beginPath();
  ctx.moveTo(left, y1);
  ctx.lineTo(right, y1);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = c.sub;
  ctx.font = font(11);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(t('day.label', { day: 1 }), left, H - 6 * scale);
  ctx.textAlign = 'right';
  ctx.fillText(t('day.label', { day: cfg.days }), right, H - 6 * scale);

  const line = (from: number, to: number, f: (n: number) => number, color: string, width: number, dash: number[] = []) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.setLineDash(dash.map((d) => d * scale));
    ctx.beginPath();
    for (let n = from; n <= to; n++) (n === from ? ctx.moveTo : ctx.lineTo).call(ctx, x(n), y(f(n)));
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // 銀行の1億円
  line(1, cfg.days, (n) => bankOnDay(n, cfg.bank), c.bank, 2.5);
  ctx.fillStyle = c.sub;
  ctx.font = font(11);
  ctx.textAlign = 'left';
  ctx.fillText(t('day.oneOku'), left + 4 * scale, y1 - 6 * scale);

  // 1円側：乗り換えた日までは太い金色、その後は薄い点線
  const until = switchDay ?? cfg.days;
  if (switchDay != null) {
    ctx.globalAlpha = 0.45;
    line(switchDay, cfg.days, yenOnDay, c.gold, 2, [3, 5]);
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.gold;
    ctx.font = font(11);
    ctx.textAlign = 'right';
    ctx.fillText(t('result.ifKept'), x(cfg.days) - 8 * scale, y(yenOnDay(cfg.days)) + 4 * scale);
  }
  if (until > 1) line(1, until, yenOnDay, c.gold, 3.5);
  ctx.fillStyle = c.gold;
  ctx.beginPath();
  ctx.arc(x(until), y(yenOnDay(until)), 4 * scale, 0, Math.PI * 2);
  ctx.fill();

  if (switchDay != null) {
    // 乗り換えた日の印
    ctx.font = font(20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(cfg.emoji.switch, x(switchDay), Math.min(y(yenOnDay(switchDay)), bottom) - 6 * scale);
  } else {
    ctx.font = font(12, true);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText(t('day.yenLine'), x(cfg.days) - 10 * scale, y(yenOnDay(cfg.days)));
  }
}

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** 画面用：canvas の表示サイズに合わせて描く */
export function resultGraphCanvas(switchDay: number | null, cfg: ResultGraphCfg): { el: HTMLCanvasElement; dispose: () => void } {
  const el = document.createElement('canvas');
  el.className = 'graph graph-result';
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', t('result.heading'));
  let raf = 0;
  const draw = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width: W, height: H } = el.getBoundingClientRect();
    if (W === 0 || H === 0) {
      raf = requestAnimationFrame(draw);
      return;
    }
    el.width = Math.round(W * dpr);
    el.height = Math.round(H * dpr);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawResultGraphOn(ctx, W, H, switchDay, cfg, { line: css('--line'), sub: css('--text-sub'), gold: css('--gold'), bank: css('--bank') });
  };
  draw();
  window.addEventListener('resize', draw);
  return {
    el,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', draw);
    },
  };
}
