// data/ の JSON を確かめ、30日分の数字・たとえ・区分の表と、日記の中の数字の検算を出す。使い方：node validate.mjs
import fs from 'node:fs';
import * as K from './compound.mjs';
const load = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url), 'utf8'));
const C = load('../src/data/config.json'), J = load('../src/data/i18n/ja.json');
const fmt = (n) => n.toLocaleString('ja-JP');
let ok = true;
const check = (cond, msg) => { console.log(`${cond ? 'OK ' : '★NG'} ${msg}`); if (!cond) ok = false; };

console.log('## 1. データの検査');
check(C.days === 30 && C.startYen === 1 && C.multiplier === 2, '30日・1円・2倍');
check(Object.keys(J.diary).length === C.days && Array.from({ length: C.days }, (_, i) => J.diary[`d${i + 1}`]).every((d) => d && d.text && J.speakers[d.speaker]), '日記が30日分あり、話す人の記号がある');
// 区分：1〜30 をすき間なく重なりなく覆う
const cover = Array(31).fill(0);
for (const g of C.groups) for (let d = g.from; d <= g.to; d++) cover[d]++;
check(cover.slice(1).every((c) => c === 1), '区分が1〜30日をすき間・重なりなく覆う');
check(C.groups.every((g) => J.titles[g.titleId] && J.endings[g.endingId]), '区分の称号・エンディングの文がある');
// たとえ：fromDay にちょうど切り替わる
for (const a of C.analogies) {
  const hit = K.analogyFor(a.fromDay, C.analogies).id === a.id;
  const prevNot = a.fromDay === 1 || K.analogyFor(a.fromDay - 1, C.analogies).id !== a.id;
  check(hit && prevNot && J.analogies[a.id], `たとえ ${a.id} は ${a.fromDay}日目（${fmt(K.yenOnDay(a.fromDay))}円）に切り替わる`);
}
// 現実版
for (const r of C.reality.rows) {
  const v = K.reality(C.reality.monthly, r.rate, r.startAge, C.reality.endAge);
  check(v.total === r.expectTotal && v.deposited === r.expectDeposited && J.reality.rows[r.id], `現実版 ${r.id}：${fmt(v.total)}円（${K.toMan(v.total)}）／積立 ${fmt(v.deposited)}円`);
}
check(C.links.portal.startsWith('https://app-lab-rust.vercel.app'), 'まとめサイトのリンク');
check(K.yenOnDay(30) <= Number.MAX_SAFE_INTEGER, '30日目の額が JavaScript の数値で正確に扱える');

console.log('\n## 2. 日記・エンディングの中の数字の検算');
const B = C.bank;
check(K.bankDailyInterest(B) === 548, `12日目「銀行で548円増えた」：1日の利息 ${K.bankDailyInterest(B)}円`);
check(K.increaseOnDay(12) === 1024, `12日目「こっちは1,024円増えた」：${fmt(K.increaseOnDay(12))}円`);
check(K.yenOnDay(11) > 1000 && K.yenOnDay(10) < 1000, `11日目「初めて千円を超えた」：${fmt(K.yenOnDay(11))}円`);
const i15 = K.bankInterest(15, B);
check(i15 >= 7500 && i15 < 8500, `15日目「8,000円くらい増えた」：${fmt(i15)}円`);
check(K.yenOnDay(15) > 10000 && K.yenOnDay(14) < 10000, `15日目「やっと1万円を超えた」：${fmt(K.yenOnDay(15))}円`);
check(Math.round((1e8 - K.yenOnDay(17)) / 1e4) === 9993, `17日目「あと9,993万円」：${fmt(1e8 - K.yenOnDay(17))}円`);
check(K.yenOnDay(21) > 1e6 && K.yenOnDay(21) / 1e8 < 0.011, `21日目「100万円を超えた／1%」：${fmt(K.yenOnDay(21))}円`);
check(Math.round((1e8 - K.yenOnDay(27)) / 1e4) === 3289, `27日目「あと3,289万円」：${fmt(1e8 - K.yenOnDay(27))}円`);
check(K.yenOnDay(28) > 1e8 && K.yenOnDay(27) < 1e8 && C.reverseDay === 28, `28日目「超えた」：${fmt(K.yenOnDay(28))}円`);
check(Math.round(K.bankInterest(30, B) / 1000) / 10 === 1.6, `30日目「利息は1.6万円」：${fmt(K.bankInterest(30, B))}円`);
check(K.toOkuMan(K.yenOnDay(30)) === '5億3,687万円', `30日目「5億3,687万円」：${fmt(K.yenOnDay(30))}円`);
const r = C.reality.rows.map((x) => K.reality(C.reality.monthly, x.rate, x.startAge, C.reality.endAge));
const depRatio = r[0].deposited / r[1].deposited, totRatio = r[0].total / r[1].total;
check(Math.round(depRatio) === 2 && Math.round(totRatio * 10) / 10 === 3.5, `現実版「積立は約2倍、結果は約3.5倍の差」：${depRatio.toFixed(2)}倍／${totRatio.toFixed(2)}倍`);

console.log('\n## 3. 30日分の表');
const rows = ['| 日 | 1円側 | 今日増えた額 | 銀行の1億円 | 縦軸の上 | たとえ | 乗り換えたときの区分・称号 |', '| --- | --- | --- | --- | --- | --- | --- |'];
for (let n = 1; n <= 30; n++) {
  const g = K.groupFor(n === 30 ? null : n, C.groups);
  rows.push(`| ${n} | ${fmt(K.yenOnDay(n))} | +${fmt(K.increaseOnDay(n))} | ${fmt(K.bankOnDay(n, B))} | ${fmt(K.yMaxForDay(n, C))} | ${J.analogies[K.analogyFor(n, C.analogies).id]} | ${g.id} ${J.titles[g.titleId]} |`);
}
console.log(rows.join('\n'));

console.log('\n## 4. エンディングの差し込み値と、シェアの文の例');
for (const sd of [1, 10, 22, 25, 27, 28, 29, null]) {
  const g = K.groupFor(sd, C.groups), v = K.endingVars(sd, C);
  const end = J.endings[g.endingId].replace('{daysToReverse}', v.daysToReverse).replace('{overYen}', v.overYen != null ? fmt(v.overYen) : '');
  console.log(`- ${sd ?? '完走'}：受け取り ${fmt(K.received(sd, C))}円／差 ${fmt(K.gapToFull(sd, C))}円／${end}`);
}
const share = (sd) => {
  const g = K.groupFor(sd, C.groups);
  const t = sd == null ? J.share.completed : J.share.switched;
  return t.replace('{day}', sd).replace('{left}', C.days - sd).replace('{title}', J.titles[g.titleId]).replace('{grid}', K.emojiGrid(sd, C, C.emoji)).replace('{hashtag}', C.hashtag);
};
console.log('\n```\n' + share(22) + '\n```\n```\n' + share(null) + '\n```');

console.log(`\n結果：${ok ? 'すべて OK' : '★ NG あり'}`);
process.exit(ok ? 0 : 1);
