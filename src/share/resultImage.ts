// 結果画像 1200×630（設計書 6章）。画面に出さない Canvas に描いて PNG にする。
// 30マスは入れない（2026-11-20 オーナー決定）

import { groupFor, yenOnDay } from '../core/compound';
import { config } from '../data';
import { toOkuMan } from '../format';
import { t, type MessageKey } from '../i18n';
import { drawResultGraphOn } from '../ui/resultGraph';
import { shareUrl } from './share';

const W = 1200;
const H = 630;
const FONT = 'system-ui, "Hiragino Sans", "Noto Sans JP", sans-serif';
const SERIF = '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", serif';
// 画面の「日記帳」の色と同じ（style.css）
const C = {
  bg: '#fbf7ee',
  card: '#fffdf8',
  text: '#2b261f',
  sub: '#7a6d5c',
  line: '#e4d8bf',
  gold: '#b97f0e',
  bank: '#9b9486',
};

/** 2行に分けてよい所。区切りの文字（i18n の text.breakAfter。「を」「で」など）の後ろを優先し、
 *  なければ、小さい字（ッ・ャ など）や「ー」で行が始まらない所 */
function breakPoints(chars: string[]): number[] {
  const after = t('text.breakAfter');
  const noStart = t('text.noLineStart');
  const all = chars.map((_, i) => i).slice(1);
  const nice = all.filter((i) => after.includes(chars[i - 1]!));
  return nice.length ? nice : all.filter((i) => !noStart.includes(chars[i]!));
}

/** 幅に収める。少し小さくして1行に入ればそのまま、入らなければ長さが揃うように2行に分ける
 *  （「軽自動車で降りた／人」のように1文字だけ次の行に落ちないように） */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight: number, family = FONT): { lines: string[]; size: number } {
  const chars = [...text];
  const width = (s: string) => ctx.measureText(s).width;
  for (let s = size; s >= 40; s -= 2) {
    ctx.font = `${weight} ${s}px ${family}`;
    if (width(text) <= maxWidth) return { lines: [text], size: s };
  }
  for (let s = size; s >= 20; s -= 2) {
    ctx.font = `${weight} ${s}px ${family}`;
    let best: string[] | null = null;
    let bestMax = Infinity;
    for (const i of breakPoints(chars)) {
      const a = chars.slice(0, i).join('');
      const b = chars.slice(i).join('');
      const m = Math.max(width(a), width(b));
      if (m <= maxWidth && m < bestMax) {
        bestMax = m;
        best = [a, b];
      }
    }
    if (best) return { lines: best, size: s };
  }
  return { lines: [text], size: 20 };
}

export function drawResultImage(ctx: CanvasRenderingContext2D, switchDay: number | null): void {
  const g = groupFor(switchDay, config.groups);
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textBaseline = 'alphabetic';

  // 作品名
  ctx.fillStyle = C.text;
  ctx.font = `800 40px ${SERIF}`;
  ctx.textAlign = 'left';
  ctx.fillText(t('meta.name'), 48, 76);

  // 左：30日分の2本の線
  ctx.fillStyle = C.card;
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, 100, 660, 456, 20);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(56, 114);
  drawResultGraphOn(ctx, 628, 428, switchDay, config, { line: C.line, sub: C.sub, gold: C.gold, bank: C.bank }, 1.5);
  ctx.restore();
  // 30マスは画像に入れない（2026-11-20 オーナー決定）

  // 右：称号・乗り換えた日・額
  const rx = 740;
  const rw = W - rx - 48;
  ctx.fillStyle = C.sub;
  ctx.font = `700 26px ${FONT}`;
  ctx.fillText(t('result.titleLabel', { title: '' }), rx, 150);
  const title = wrapLines(ctx, t(`titles.${g.titleId}` as MessageKey), rw, 48, 800, SERIF);
  ctx.fillStyle = C.text;
  ctx.font = `800 ${title.size}px ${SERIF}`;
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
