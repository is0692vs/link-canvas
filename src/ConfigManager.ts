import * as vscode from 'vscode';

/**
 * Link Canvasの設定を管理するクラス
 */
export class ConfigManager {
    /**
     * 現在の設定を取得
     */
    public static getConfig(): any {
        const config = vscode.workspace.getConfiguration('linkCanvas');
        
        console.log('[Link Canvas] 設定を読み込み');
        
        return {
            theme: config.get('theme', 'dark'),
            customTheme: {
                backgroundColor: config.get('customTheme.backgroundColor', '#1e1e1e'),
                gridColor: config.get('customTheme.gridColor', 'rgba(255, 255, 255, 0.05)'),
            },
            window: {
                borderColor: config.get('window.borderColor', '#666666'),
                borderWidth: config.get('window.borderWidth', 1),
                borderRadius: config.get('window.borderRadius', 8),
                backgroundColor: config.get('window.backgroundColor', '#ffffff'),
                titleBarColor: config.get('window.titleBarColor', '#f0f0f0'),
                shadowColor: config.get('window.shadowColor', 'rgba(0, 0, 0, 0.15)'),
            },
            font: {
                family: config.get('font.family', ''),
                size: config.get('font.size', 14),
            },
        };
    }

    /**
     * 設定変更を監視するリスナーを登録
     */
    public static onConfigChange(callback: () => void): vscode.Disposable {
        console.log('[Link Canvas] 設定変更リスナーを登録');
        return vscode.workspace.onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('linkCanvas')) {
                console.log('[Link Canvas] 設定が変更されました');
                callback();
            }
        });
    }
}
