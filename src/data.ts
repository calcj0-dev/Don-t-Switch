// JSON のデータを読み込み、検査してから渡す窓口（設計書 4章）。おかしければここで止まる（T-07）

import { assertData } from './core/validate';
import configJson from './data/config.json';
import jaJson from './data/i18n/ja.json';

export const config = configJson;

/** 言語ごとの文言。言語を足すときは JSON を作ってここに1行足す（共通の決まり C7） */
export const messagesByLocale = { ja: jaJson };

for (const m of Object.values(messagesByLocale)) assertData(config, m);
