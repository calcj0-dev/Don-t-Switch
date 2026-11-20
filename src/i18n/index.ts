// 文言の取り出し（共通の決まり C6・C7）。キーは「title.start」のように点でつなぐ。公開時は常に ja

import { messagesByLocale } from '../data';

export type Locale = keyof typeof messagesByLocale;
type Messages = (typeof messagesByLocale)['ja'];

/** 文言の JSON の、文字の項目すべての「点でつないだキー」 */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : T[K] extends object ? Leaves<T[K], `${P}${K}.`> : never;
}[keyof T & string];

export type MessageKey = Leaves<Messages>;
export type Vars = Record<string, string | number>;

let messages: Messages = messagesByLocale.ja;

export function setLocale(next: Locale): void {
  messages = messagesByLocale[next];
  if (typeof document !== 'undefined') document.documentElement.lang = next;
}

/** {name} の形の差し込みを置き換える。値がない差し込みはそのまま残す */
export function format(template: string, vars: Vars = {}): string {
  return template.replace(/\{(\w+)\}/g, (all, name: string) => (name in vars ? String(vars[name]) : all));
}

/** 点でつないだキーで文言を引く。見つからなければキーをそのまま返す */
export function t(key: MessageKey, vars?: Vars): string {
  let v: unknown = messages;
  for (const part of key.split('.')) v = v && typeof v === 'object' ? (v as Record<string, unknown>)[part] : undefined;
  return format(typeof v === 'string' ? v : key, vars);
}
