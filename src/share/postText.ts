// 投稿文（設計書 5.5）：決まった文＋絵文字30マス＋ハッシュタグ

import { emojiGrid, groupFor } from '../core/compound';
import { config } from '../data';
import { t, type MessageKey } from '../i18n';

export function postText(switchDay: number | null): string {
  const g = groupFor(switchDay, config.groups);
  const vars = {
    title: t(`titles.${g.titleId}` as MessageKey),
    grid: emojiGrid(switchDay, config, config.emoji),
    hashtag: config.hashtag,
  };
  return switchDay == null
    ? t('share.completed', vars)
    : t('share.switched', { ...vars, day: switchDay, left: config.days - switchDay });
}
