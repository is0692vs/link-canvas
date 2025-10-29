import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// メッセージ型定義
interface DefinitionMessage {
    type: 'showDefinition';
    filePath: string;
    line: number;
    column: number;
}

interface ReferencesMessage {
    type: 'showReferences';
    filePath: string;
    line: number;
    column: number;
}

type WebviewMessage = DefinitionMessage | ReferencesMessage;

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

            // Webview からのメッセージを受け取り、拡張ホストのデバッグコンソールに出力する
            this.panel.webview.onDidReceiveMessage(async (message: WebviewMessage) => {
                try {
                    if (message && message.type === 'resizePlacement') {
                        console.log('[Link Canvas] リサイズ配置:', (message as any).placement, 'windowId:', (message as any).windowId);
                    } else if (message.type === 'showDefinition') {
                        await this.handleDefinitionRequest(message, this.panel!.webview);
                    } else if (message.type === 'showReferences') {
                        await this.handleReferencesRequest(message, this.panel!.webview);
                    } else {
                        console.log('[Link Canvas] Webview message:', message);
                    }
                } catch (err) {
                    console.log('[Link Canvas] onDidReceiveMessage error', err);
                }
            });

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

    /**
     * エディタコンテキストメニューから呼び出され、定義を取得してキャンバスに追加
     */
    public async handleShowDefinitionFromContext(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('アクティブなエディタがありません');
            return;
        }

        const uri = editor.document.uri;
        const position = editor.selection.active;

        console.log('[Link Canvas] 定義表示開始:', uri.fsPath, 'Position:', position.line, position.character);

        try {
            // 定義情報を取得
            const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position
            );

            if (!definitions || definitions.length === 0) {
                vscode.window.showInformationMessage('定義が見つかりませんでした');
                return;
            }

            // キャンバスが開かれていなければ開く
            await this.openOrAddFile(uri);

            // 各定義をキャンバスに追加
            for (const definition of definitions) {
                await this.addDefinitionToCanvas(definition);
            }

            console.log('[Link Canvas] 定義数:', definitions.length);
        } catch (error) {
            console.error('[Link Canvas] 定義取得エラー:', error);
            vscode.window.showErrorMessage('定義の取得に失敗しました');
        }
    }

    /**
     * エディタコンテキストメニューから呼び出され、参照を取得してキャンバスに追加
     */
    public async handleShowReferencesFromContext(): Promise<void> {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('アクティブなエディタがありません');
            return;
        }

        const uri = editor.document.uri;
        const position = editor.selection.active;

        console.log('[Link Canvas] 参照表示開始:', uri.fsPath, 'Position:', position.line, position.character);

        try {
            // 参照情報を取得
            const references = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                position
            );

            if (!references || references.length === 0) {
                vscode.window.showInformationMessage('参照が見つかりませんでした');
                return;
            }

            // キャンバスが開かれていなければ開く
            await this.openOrAddFile(uri);

            // 各参照をキャンバスに追加
            for (const reference of references) {
                await this.addReferenceToCanvas(reference);
            }

            console.log('[Link Canvas] 参照数:', references.length);
        } catch (error) {
            console.error('[Link Canvas] 参照取得エラー:', error);
            vscode.window.showErrorMessage('参照の取得に失敗しました');
        }
    }

    /**
     * Locationからファイル情報を取得してキャンバスに追加
     */
    private async addDefinitionToCanvas(definition: vscode.Location): Promise<void> {
        try {
            const fileContent = await vscode.workspace.fs.readFile(definition.uri);
            const content = Buffer.from(fileContent).toString('utf8');
            const fileName = path.basename(definition.uri.fsPath);

            console.log('[Link Canvas] 定義ファイルをキャンバスに追加:', fileName);

            this.panel!.webview.postMessage({
                type: 'addFile',
                filePath: definition.uri.fsPath,
                fileName: fileName,
                content: content,
                highlightLine: definition.range.start.line,
                highlightColumn: definition.range.start.character,
            });
        } catch (error) {
            console.error('[Link Canvas] 定義ファイル読み込みエラー:', error);
        }
    }

    /**
     * Locationからファイル情報を取得してキャンバスに追加
     */
    private async addReferenceToCanvas(reference: vscode.Location): Promise<void> {
        try {
            const fileContent = await vscode.workspace.fs.readFile(reference.uri);
            const content = Buffer.from(fileContent).toString('utf8');
            const fileName = path.basename(reference.uri.fsPath);

            console.log('[Link Canvas] 参照ファイルをキャンバスに追加:', fileName);

            this.panel!.webview.postMessage({
                type: 'addFile',
                filePath: reference.uri.fsPath,
                fileName: fileName,
                content: content,
                highlightLine: reference.range.start.line,
                highlightColumn: reference.range.start.character,
            });
        } catch (error) {
            console.error('[Link Canvas] 参照ファイル読み込みエラー:', error);
        }
    }

    /**
     * Webviewからの定義取得リクエストを処理
     */
    private async handleDefinitionRequest(
        message: DefinitionMessage,
        webview: vscode.Webview
    ): Promise<void> {
        try {
            const uri = vscode.Uri.file(message.filePath);
            const position = new vscode.Position(message.line, message.column);

            const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position
            );

            console.log('[Link Canvas] Webviewからの定義取得:', definitions?.length || 0);

            if (definitions && definitions.length > 0) {
                for (const def of definitions) {
                    await this.addDefinitionToCanvas(def);
                }
            }
        } catch (error) {
            console.error('[Link Canvas] Webviewの定義取得エラー:', error);
        }
    }

    /**
     * Webviewからの参照取得リクエストを処理
     */
    private async handleReferencesRequest(
        message: ReferencesMessage,
        webview: vscode.Webview
    ): Promise<void> {
        try {
            const uri = vscode.Uri.file(message.filePath);
            const position = new vscode.Position(message.line, message.column);

            const references = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                position
            );

            console.log('[Link Canvas] Webviewからの参照取得:', references?.length || 0);

            if (references && references.length > 0) {
                for (const ref of references) {
                    await this.addReferenceToCanvas(ref);
                }
            }
        } catch (error) {
            console.error('[Link Canvas] Webviewの参照取得エラー:', error);
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
