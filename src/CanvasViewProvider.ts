import * as vscode from 'vscode';

export class CanvasViewProvider {
    constructor(private readonly extensionUri: vscode.Uri) { }

    public resolveWebviewView(panel: vscode.WebviewPanel, fileUri?: vscode.Uri) {
        panel.webview.options = {
            enableScripts: true,
        };

        panel.webview.html = this.getHtmlForWebview(panel.webview);

        // Send initial file to webview
        if (fileUri) {
            panel.webview.postMessage({
                type: 'addFile',
                filePath: fileUri.fsPath,
            });
        }
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
