// 計算（設計書 3章）。参照実装 sim/compound.mjs をそのまま移したもの。金額はすべて整数の円

export type Bank = { principal: number; annualRate: number };
export type Group = { id: string; from: number; to: number; titleId: string; endingId: string; sound: string };
export type Analogy = { id: string; fromDay: number; minYen: number };
export type CoreConfig = {
  days: number;
  switchAmount: number;
  reverseDay: number;
  graph: { yMaxBase: number; expandFromDay: number; overflowMargin: number };
};
export type Emoji = { keep: string; switch: string; after: string };

/** n日目の1円側の額 = 2^(n-1) 円 */
export const yenOnDay = (n: number): number => 2 ** (n - 1);

/** n日目に「今日増えた額」= n日目 − (n−1)日目。1日目は 1円（もらった額） */
export const increaseOnDay = (n: number): number => (n === 1 ? 1 : yenOnDay(n) - yenOnDay(n - 1));

/** 銀行の1億円：単利・日割り。n日目までの利息 = round(元本 × 年利 × n ÷ 365) */
export const bankInterest = (n: number, bank: Bank): number => Math.round((bank.principal * bank.annualRate * n) / 365);
export const bankOnDay = (n: number, bank: Bank): number => bank.principal + bankInterest(n, bank);
/** 1日あたりの利息（日記の「548円」） */
export const bankDailyInterest = (bank: Bank): number => Math.round((bank.principal * bank.annualRate) / 365);

/** 乗り換えた日（1〜29）、または 30日完走（switchDay = null）→ 区分 */
export const groupFor = <G extends Group>(switchDay: number | null, groups: readonly G[]): G => {
  const d = switchDay ?? 30;
  const g = groups.find((x) => d >= x.from && d <= x.to);
  if (!g) throw new Error(`group not found: ${d}`);
  return g;
};

/** 受け取った額：乗り換えたら 1億円、完走なら 30日目の額 */
export const received = (switchDay: number | null, cfg: CoreConfig): number =>
  switchDay == null ? yenOnDay(cfg.days) : cfg.switchAmount;

/** 最後まで我慢した場合との差（完走は 0） */
export const gapToFull = (switchDay: number | null, cfg: CoreConfig): number => yenOnDay(cfg.days) - received(switchDay, cfg);

/** その日の額で買える一番高いたとえ */
export const analogyFor = <A extends Analogy>(n: number, analogies: readonly A[]): A => {
  const y = yenOnDay(n);
  let hit = analogies[0];
  if (!hit) throw new Error('analogies is empty');
  for (const a of analogies) if (a.minYen <= y) hit = a;
  return hit;
};

/** エンディングの差し込み値 */
export const endingVars = (switchDay: number | null, cfg: CoreConfig): { daysToReverse?: number; overYen?: number } => {
  if (switchDay == null) return {};
  return {
    daysToReverse: cfg.reverseDay - switchDay, // 25〜27日目用「逆転まで、あと◯日」
    overYen: yenOnDay(switchDay) - cfg.switchAmount, // 28〜29日目用「◯円を大富豪に返した」
  };
};

/** 絵文字30マス（10マスで改行） */
export const emojiGrid = (switchDay: number | null, cfg: Pick<CoreConfig, 'days'>, e: Emoji = { keep: '🟩', switch: '💴', after: '⬜' }): string => {
  const cells: string[] = [];
  for (let n = 1; n <= cfg.days; n++) {
    if (switchDay == null || n < switchDay) cells.push(e.keep);
    else if (n === switchDay) cells.push(e.switch);
    else cells.push(e.after);
  }
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 10) rows.push(cells.slice(i, i + 10).join(''));
  return rows.join('\n');
};

/** グラフの縦軸の上限（決定 #6）。〜28日目は yMaxBase のまま（28日目は線が枠を突き抜けて見える）。29・30日目だけ広げる */
export const yMaxForDay = (n: number, cfg: CoreConfig): number =>
  n < cfg.graph.expandFromDay
    ? cfg.graph.yMaxBase
    : Math.max(cfg.graph.yMaxBase, Math.ceil((yenOnDay(n) * cfg.graph.overflowMargin) / 1e7) * 1e7);

/** 現実版：毎月 monthly 円を月初めに入れ、年利 rate を12で割って月複利、startAge から endAge まで */
export const reality = (monthly: number, rate: number, startAge: number, endAge: number): { total: number; deposited: number } => {
  const months = (endAge - startAge) * 12;
  const i = rate / 12;
  let v = 0;
  for (let m = 0; m < months; m++) v = (v + monthly) * (1 + i);
  return { total: Math.round(v), deposited: monthly * months };
};

/** 万円表記（四捨五入）。例 54,561,899 → "5,456万円" */
export const toMan = (yen: number): string => `${Math.round(yen / 10000).toLocaleString('ja-JP')}万円`;
/** 「5億3,687万円」形式 */
export const toOkuMan = (yen: number): string => {
  const oku = Math.floor(yen / 1e8),
    man = Math.floor((yen % 1e8) / 1e4);
  return oku > 0 ? `${oku}億${man ? man.toLocaleString('ja-JP') + '万' : ''}円` : `${man.toLocaleString('ja-JP')}万円`;
};
