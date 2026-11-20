// JSON のデータを読み込む窓口（設計書 4章）。中身の検査は #2 で足す

import configJson from './data/config.json';
import jaJson from './data/i18n/ja.json';

export const config = configJson;

/** 言語ごとの文言。言語を足すときは JSON を作ってここに1行足す（共通の決まり C7） */
export const messagesByLocale = { ja: jaJson };
