// 画面の切り替えと説明窓（設計書 2章）。ページの読み込みは起こさない（前作の app.ts を簡単にしたもの）

export type ScreenName = 'title' | 'offer' | 'day' | 'ending' | 'result' | 'reality';
export type ModalName = 'how' | 'privacy' | 'confirmTitle';

export type App = {
  go(screen: ScreenName): void;
  openModal(modal: ModalName): void;
  closeModal(): void;
  readonly screen: ScreenName;
};

export type ScreenView = { el: HTMLElement; unmount?: () => void };
export type ScreenFactory = (app: App) => ScreenView;
export type ModalFactory = (app: App) => HTMLElement;

export function createApp(root: HTMLElement, screens: Record<ScreenName, ScreenFactory>, modals: Record<ModalName, ModalFactory>): App {
  const main = document.createElement('div');
  main.className = 'screen-host';
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  root.replaceChildren(main, dialog);

  let current: ScreenView | null = null;
  let screenName: ScreenName = 'title';

  const app: App = {
    get screen() {
      return screenName;
    },
    go(next) {
      app.closeModal();
      current?.unmount?.();
      screenName = next;
      current = screens[next](app);
      main.replaceChildren(current.el);
      main.dataset.screen = next;
      window.scrollTo(0, 0);
    },
    openModal(name) {
      dialog.replaceChildren(modals[name](app));
      dialog.dataset.modal = name;
      if (!dialog.open) dialog.showModal();
    },
    closeModal() {
      if (dialog.open) dialog.close();
    },
  };

  // 窓の外をタップしたら閉じる
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) app.closeModal();
  });

  return app;
}
