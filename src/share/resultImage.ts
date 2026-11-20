// 結果画像 1200×630（設計書 6章）。画面に出さない Canvas に描いて PNG にする。
// 30マスは端末で絵文字の見た目が違うため、色の四角で描く

import { groupFor, yenOnDay } from '../core/compound';
import { config } from '../data';
import { toOkuMan } from '../format';
import { t, type MessageKey } from '../i18n';
import { drawResultGraphOn } from '../ui/resultGraph';
import { shareUrl } from './share';

const W = 1200;
const H = 630;
const FONT = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
const C = {
  text: '#1a1f2b',
  sub: '#5f6779',
  surface: '#f5f7fa',
  line: '#e3e7ed',
  gold: '#c98a12',
  bank: '#8a93a3',
  keep: '#3fae5a',
  after: '#dfe3e9',
};

/** 幅に収まるよう1文字ずつ折り返す（最大 maxLines 行。あふれたら文字を小さくする） */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number, maxLines = 2): { lines: string[]; size: number } {
  for (let s = size; s >= 20; s -= 2) {
    ctx.font = `${weight} ${s}px ${FONT}`;
    const lines: string[] = [];
    let cur = '';
    for (const ch of text) {
      if (ctx.measureText(cur + ch).width > maxWidth && cur) {
        lines.push(cur);
        cur = ch;
      } else cur += ch;
    }
    if (cur) lines.push(cur);
    if (lines.length <= maxLines) return { lines, size: s };
  }
  return { lines: [text], size: 20 };
}

export function drawResultImage(ctx: CanvasRenderingContext2D, switchDay: number | null): void {
  const g = groupFor(switchDay, config.groups);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // 作品名
  ctx.fillStyle = C.text;
  ctx.font = `800 40px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(t('meta.name'), 48, 76);

  // 左：30日分の2本の線
  ctx.fillStyle = C.surface;
  ctx.beginPath();
  ctx.roundRect(40, 100, 660, 340, 20);
  ctx.fill();
  ctx.save();
  ctx.translate(56, 112);
  drawResultGraphOn(ctx, 628, 316, switchDay, config, { line: C.line, sub: C.sub, gold: C.gold, bank: C.bank }, 1.5);
  ctx.restore();

  // 左下：30マス（色の四角）
  const cell = 26;
  const gap = 6;
  for (let n = 1; n <= config.days; n++) {
    const i = n - 1;
    const x = 48 + (i % 10) * (cell + gap);
    const y = 462 + Math.floor(i / 10) * (cell + gap);
    ctx.fillStyle = switchDay == null || n < switchDay ? C.keep : n === switchDay ? C.gold : C.after;
    ctx.beginPath();
    ctx.roundRect(x, y, cell, cell, 5);
    ctx.fill();
  }

  // 右：称号・乗り換えた日・額
  const rx = 740;
  const rw = W - rx - 48;
  ctx.fillStyle = C.sub;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(t('result.titleLabel', { title: '' }), rx, 150);
  const title = wrapLines(ctx, t(`titles.${g.titleId}` as MessageKey), rw, 48, 800);
  ctx.fillStyle = C.text;
  ctx.font = `800 ${title.size}px ${FONT}`;
  title.lines.forEach((l, i) => ctx.fillText(l, rx, 210 + i * (title.size + 12)));

  let y = 210 + title.lines.length * (title.size + 12) + 40;
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = C.text;
  ctx.fillText(switchDay == null ? t('result.completed') : t('result.switchedOn', { day: switchDay }), rx, y, rw);
  y += 56;
  ctx.fillStyle = C.gold;
  ctx.font = `800 36px ${FONT}`;
  const full = toOkuMan(yenOnDay(config.days));
  ctx.fillText(switchDay == null ? full : t('image.left', { left: config.days - switchDay, amount: full }), rx, y, rw);

  // 下：注意書きと URL
  ctx.fillStyle = C.sub;
  ctx.font = `400 20px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(t('image.note'), 48, 600);
  ctx.textAlign = 'right';
  ctx.fillText(shareUrl().replace(/^https?:\/\//, '').replace(/\/$/, ''), W - 48, 600);
}

export async function renderResultImage(switchDay: number | null): Promise<Blob | null> {
  try {
    await document.fonts?.ready;
  } catch {
    // フォントの読み込みを待てなくても描く
  }
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  drawResultImage(ctx, switchDay);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
}
