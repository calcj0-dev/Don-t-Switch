// 金額の表記。単位の文字（万・億）は文言のデータ（i18n の units）に置く（T-08）

import { manRounded, okuMan } from './core/compound';
import { t } from './i18n';

const num = (n: number): string => n.toLocaleString('ja-JP');

/** 整数の円を3桁区切りで */
export const yen = (n: number): string => num(n);

/** 「5,456万円」（四捨五入） */
export const toMan = (n: number): string => t('units.man', { man: num(manRounded(n)) });

/** 「5億3,687万円」「5億円」「3,687万円」（切り捨て） */
export const toOkuMan = (n: number): string => {
  const { oku, man } = okuMan(n);
  if (oku === 0) return t('units.man', { man: num(man) });
  return man ? t('units.okuMan', { oku, man: num(man) }) : t('units.oku', { oku });
};
