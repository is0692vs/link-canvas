import * as vscode from 'vscode';

export class CanvasViewProvider {
    private panel: vscode.WebviewPanel | undefined;

    constructor(private readonly extensionUri: vscode.Uri) { }

    public async openOrAddFile(fileUri: vscode.Uri): Promise<void> {
        // 既存のパネルがあれば再利用
        if (!this.panel) {
            console.log('[Link Canvas] 新しいWebview Panelを作成');
            this.panel = vscode.window.createWebviewPanel(
                'linkCanvas',
                'Link Canvas',
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                }
            );

            this.panel.webview.options = {
                enableScripts: true,
            };

            this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

            // パネルが閉じられたらクリア
            this.panel.onDidDispose(() => {
                console.log('[Link Canvas] Webview Panel閉じられた');
                this.panel = undefined;
            });
        } else {
            console.log('[Link Canvas] 既存のWebview Panelを再利用');
            this.panel.reveal(vscode.ViewColumn.One);
        }

        // ファイル内容を読み込んでWebviewに送信
        try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(fileContent).toString('utf8');
            const fileName = fileUri.path.split('/').pop() || 'unknown';

            console.log('[Link Canvas] ファイル送信:', fileName, 'サイズ:', content.length);

            this.panel!.webview.postMessage({
                type: 'addFile',
                filePath: fileUri.fsPath,
                fileName: fileName,
                content: content,
            });
        } catch (error) {
            console.error('[Link Canvas] ファイル読み込みエラー:', error);
            vscode.window.showErrorMessage('ファイルの読み込みに失敗しました');
        }
    }

    public sendZoomCommand(command: 'zoomIn' | 'zoomOut'): void {
        if (!this.panel) {
            console.log('[Link Canvas] Webview Panelが存在しません');
            return;
        }

        console.log('[Link Canvas] ズームコマンド送信:', command);
        this.panel.webview.postMessage({
            type: command,
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js'));
        return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Link Canvas</title>
      <style>
        body { margin: 0; padding: 0; overflow: hidden; }
        #root { width: 100vw; height: 100vh; }
      </style>
    </head>
    <body>
      <div id="root"></div>
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
    }
}
