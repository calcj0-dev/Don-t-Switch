// いま遊んでいる1回分の状態。メモリの中だけ（設計書 5.3。途中で閉じたら最初から）

import { newGame, type Game } from './core/game';

let game: Game = newGame();

export const session = {
  get game(): Game {
    return game;
  },
  set game(next: Game) {
    game = next;
  },
  reset(): void {
    game = newGame();
  },
};
