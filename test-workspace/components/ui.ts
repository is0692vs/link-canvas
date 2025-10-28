import { Logger } from './logger';

/**
 * UI ユーティリティ
 */
export class UIUtils {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('UIUtils');
  }

  /**
   * ボタンを作成
   */
  createButton(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', () => {
      this.logger.log(`Button clicked: ${label}`);
      onClick();
    });
    return button;
  }

  /**
   * パネルを作成
   */
  createPanel(title: string, content: string): HTMLDivElement {
    const panel = document.createElement('div');
    panel.className = 'panel';
    
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;
    
    const contentEl = document.createElement('p');
    contentEl.textContent = content;
    
    panel.appendChild(titleEl);
    panel.appendChild(contentEl);
    
    this.logger.log(`Panel created: ${title}`);
    return panel;
  }
}
