// 日の進み方と状態（設計書 1.1・2.2・5.3）。画面から切り離した、時刻を引数でもらう純粋な作り

export type Phase = 'offer' | 'day' | 'ending' | 'result' | 'reality';
export type Game = {
  day: number;
  /** 乗り換えた日。完走（30日目に受け取った）は null */
  switchDay: number | null;
  phase: Phase;
  /** 30日目に着いた時刻（連打の残りを捨てるため） */
  arrivedLastAt: number | null;
};
export type GameRules = { days: number; switchOnLastDay: boolean; lastDayGuardMs: number };

export const newGame = (): Game => ({ day: 1, switchDay: null, phase: 'offer', arrivedLastAt: null });

/** 申し出で「1円をもらう」→ 1日目 */
export const accept = (g: Game): Game => (g.phase === 'offer' ? { ...g, phase: 'day', day: 1 } : g);

/** 「次の日へ」を1回押した。1タップ＝1日。
 *  30日目では同じボタンが「30日目。受け取る」になるが、着いてから lastDayGuardMs のあいだのタップ（連打の残り）は捨てる */
export const pressNext = (g: Game, now: number, rules: GameRules): Game => {
  if (g.phase !== 'day') return g;
  if (g.day < rules.days) {
    const day = g.day + 1;
    return { ...g, day, arrivedLastAt: day === rules.days ? now : g.arrivedLastAt };
  }
  if (g.arrivedLastAt != null && now - g.arrivedLastAt < rules.lastDayGuardMs) return g;
  return { ...g, switchDay: null, phase: 'ending' };
};

/** 今の日に「1億円に乗り換える」が出るか（30日目は出さない：switchOnLastDay） */
export const canSwitch = (g: Game, rules: GameRules): boolean =>
  g.phase === 'day' && (g.day < rules.days || rules.switchOnLastDay);

/** 「1億円に乗り換える」。確認なしでその場で決まる（決定 #5） */
export const pressSwitch = (g: Game, rules: GameRules): Game =>
  canSwitch(g, rules) ? { ...g, switchDay: g.day, phase: 'ending' } : g;

export const toResult = (g: Game): Game => (g.phase === 'ending' ? { ...g, phase: 'result' } : g);
export const toReality = (g: Game): Game => (g.phase === 'result' ? { ...g, phase: 'reality' } : g);
