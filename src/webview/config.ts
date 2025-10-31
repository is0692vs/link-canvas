/**
 * Link Canvasのスタイル設定を管理するユーティリティモジュール
 */

export interface LinkCanvasConfig {
  theme: 'light' | 'dark' | 'custom';
  customTheme: {
    backgroundColor: string;
    gridColor: string;
  };
  window: {
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    backgroundColor: string;
    titleBarColor: string;
    shadowColor: string;
  };
  font: {
    family: string;
    size: number;
  };
}

/**
 * デフォルト設定
 */
export const DEFAULT_CONFIG: LinkCanvasConfig = {
  theme: 'dark',
  customTheme: {
    backgroundColor: '#1e1e1e',
    gridColor: 'rgba(255, 255, 255, 0.05)',
  },
  window: {
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    titleBarColor: '#f0f0f0',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
  },
  font: {
    family: '',
    size: 14,
  },
};

/**
 * ライトテーマのプリセット
 */
export const LIGHT_THEME_PRESET: Partial<LinkCanvasConfig> = {
  customTheme: {
    backgroundColor: '#ffffff',
    gridColor: 'rgba(0, 0, 0, 0.05)',
  },
  window: {
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    titleBarColor: '#f0f0f0',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
  },
};

/**
 * ダークテーマのプリセット
 */
export const DARK_THEME_PRESET: Partial<LinkCanvasConfig> = {
  customTheme: {
    backgroundColor: '#1e1e1e',
    gridColor: 'rgba(255, 255, 255, 0.05)',
  },
  window: {
    borderColor: '#3c3c3c',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#252526',
    titleBarColor: '#2d2d30',
    shadowColor: 'rgba(0, 0, 0, 0.5)',
  },
};

/**
 * 設定をCSS変数に適用する
 */
export function applyConfigToCSS(config: LinkCanvasConfig): void {
  const root = document.documentElement;

  console.log('[Link Canvas] 設定をCSS変数に適用:', config);

  // テーマに応じた背景とグリッド色を設定
  let backgroundColor: string;
  let gridColor: string;

  if (config.theme === 'light') {
    backgroundColor = LIGHT_THEME_PRESET.customTheme!.backgroundColor;
    gridColor = LIGHT_THEME_PRESET.customTheme!.gridColor;
  } else if (config.theme === 'dark') {
    backgroundColor = DARK_THEME_PRESET.customTheme!.backgroundColor;
    gridColor = DARK_THEME_PRESET.customTheme!.gridColor;
  } else {
    backgroundColor = config.customTheme.backgroundColor;
    gridColor = config.customTheme.gridColor;
  }

  // 背景とグリッド
  root.style.setProperty('--lc-background-color', backgroundColor);
  root.style.setProperty('--lc-grid-color', gridColor);

  // ウィンドウスタイル
  root.style.setProperty('--lc-window-border-color', config.window.borderColor);
  root.style.setProperty('--lc-window-border-width', `${config.window.borderWidth}px`);
  root.style.setProperty('--lc-window-border-radius', `${config.window.borderRadius}px`);
  root.style.setProperty('--lc-window-background-color', config.window.backgroundColor);
  root.style.setProperty('--lc-window-titlebar-color', config.window.titleBarColor);
  root.style.setProperty('--lc-window-shadow-color', config.window.shadowColor);

  // フォント
  if (config.font.family) {
    root.style.setProperty('--lc-font-family', config.font.family);
  } else {
    root.style.setProperty('--lc-font-family', 'var(--vscode-font-family)');
  }
  root.style.setProperty('--lc-font-size', `${config.font.size}px`);

  // テーマに応じてウィンドウスタイルを上書き
  if (config.theme === 'light') {
    Object.entries(LIGHT_THEME_PRESET.window!).forEach(([key, value]) => {
      const cssVar = `--lc-window-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      if (typeof value === 'number') {
        root.style.setProperty(cssVar, `${value}px`);
      } else {
        root.style.setProperty(cssVar, value);
      }
    });
  } else if (config.theme === 'dark') {
    Object.entries(DARK_THEME_PRESET.window!).forEach(([key, value]) => {
      const cssVar = `--lc-window-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      if (typeof value === 'number') {
        root.style.setProperty(cssVar, `${value}px`);
      } else {
        root.style.setProperty(cssVar, value);
      }
    });
  }
}

/**
 * メッセージから設定を解析する
 */
export function parseConfigFromMessage(config: any): LinkCanvasConfig {
  return {
    theme: config.theme || DEFAULT_CONFIG.theme,
    customTheme: {
      backgroundColor: config.customTheme?.backgroundColor || DEFAULT_CONFIG.customTheme.backgroundColor,
      gridColor: config.customTheme?.gridColor || DEFAULT_CONFIG.customTheme.gridColor,
    },
    window: {
      borderColor: config.window?.borderColor || DEFAULT_CONFIG.window.borderColor,
      borderWidth: config.window?.borderWidth ?? DEFAULT_CONFIG.window.borderWidth,
      borderRadius: config.window?.borderRadius ?? DEFAULT_CONFIG.window.borderRadius,
      backgroundColor: config.window?.backgroundColor || DEFAULT_CONFIG.window.backgroundColor,
      titleBarColor: config.window?.titleBarColor || DEFAULT_CONFIG.window.titleBarColor,
      shadowColor: config.window?.shadowColor || DEFAULT_CONFIG.window.shadowColor,
    },
    font: {
      family: config.font?.family ?? DEFAULT_CONFIG.font.family,
      size: config.font?.size ?? DEFAULT_CONFIG.font.size,
    },
  };
}
