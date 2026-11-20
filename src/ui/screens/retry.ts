// 「もう一回」：最初からやり直して申し出の画面へ

import { session } from '../../session';
import type { App } from '../app';

export function retry(app: App): void {
  session.reset();
  app.go('offer');
}
