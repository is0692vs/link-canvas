import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from './ConfigManager';

// 依存関係の種類
type RelationshipType = 'definition' | 'reference' | 'import' | null;

// メッセージ型定義
interface DefinitionMessage {
    type: 'showDefinition';
    filePath: string;
    line: number;
    column: number;
    selectedText?: string;
}

interface ReferencesMessage {
    type: 'showReferences';
    filePath: string;
    line: number;
    column: number;
    selectedText?: string;
}

type WebviewMessage = DefinitionMessage | ReferencesMessage;

export class CanvasViewProvider {
    private panel: vscode.WebviewPanel | undefined;
    private configChangeListener: vscode.Disposable | undefined;

    constructor(private readonly extensionUri: vscode.Uri) { }

    public async openOrAddFile(fileUri?: vscode.Uri): Promise<void> {
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
                        console.log('[Link Canvas] Webviewリクエスト受信: 定義表示', {
                            filePath: message.filePath,
                            line: message.line,
                            column: message.column,
                            selectedText: message.selectedText,
                        });
                        await this.handleDefinitionRequest(message, this.panel!.webview);
                    } else if (message.type === 'showReferences') {
                        console.log('[Link Canvas] Webviewリクエスト受信: 参照表示', {
                            filePath: message.filePath,
                            line: message.line,
                            column: message.column,
                            selectedText: message.selectedText,
                        });
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
                // 設定変更リスナーをクリーンアップ
                if (this.configChangeListener) {
                    this.configChangeListener.dispose();
                    this.configChangeListener = undefined;
                }
            });

            // 初期設定を送信
            this.sendConfig();

            // 設定変更リスナーを登録
            this.configChangeListener = ConfigManager.onConfigChange(() => {
                this.sendConfig();
            });
        } else {
            console.log('[Link Canvas] 既存のWebview Panelを再利用');
            this.panel.reveal(vscode.ViewColumn.One);
        }

        // ファイルが指定されていれば、ファイル内容を読み込んでWebviewに送信
        if (fileUri) {
            await this.addFileToCanvas(fileUri);
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
     * 現在の設定をWebviewに送信
     */
    private sendConfig(): void {
        if (!this.panel) {
            return;
        }

        const config = ConfigManager.getConfig();
        console.log('[Link Canvas] 設定をWebviewに送信:', config);

        this.panel.webview.postMessage({
            type: 'updateConfig',
            config: config,
        });
    }

    /**
     * エディタコンテキストメニューから呼び出され、定義を取得してキャンバスに追加
     */
    public async handleShowDefinitionFromContext(): Promise<void> {
        let editor = vscode.window.activeTextEditor;

        // もしアクティブなエディタがなければ、少し待ってから再試行
        if (!editor) {
            await new Promise(resolve => setTimeout(resolve, 100));
            editor = vscode.window.activeTextEditor;
        }

        if (!editor) {
            vscode.window.showErrorMessage('アクティブなエディタがありません');
            return;
        }

        const uri = editor.document.uri;
        const position = editor.selection.active;

        console.log('[Link Canvas] 定義表示開始:', uri.fsPath, 'Position:', position.line, position.character);

        try {
            // まずキャンバスを開く (ファイル内容はまだ送らない)
            await this.openOrAddFile();

            // 定義情報を取得
            console.log('[Link Canvas] executeDefinitionProvider 呼び出し前:', { uri: uri.fsPath, line: position.line, character: position.character });
            const definitionsResult = await vscode.commands.executeCommand<vscode.Location | vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position
            );
            console.log('[Link Canvas] executeDefinitionProvider 呼び出し後:', definitionsResult);

            if (!definitionsResult) {
                vscode.window.showInformationMessage('定義が見つかりませんでした');
                return;
            }

            const definitions = Array.isArray(definitionsResult) ? definitionsResult : [definitionsResult];

            if (definitions.length === 0) {
                vscode.window.showInformationMessage('定義が見つかりませんでした');
                return;
            }

            // 元のファイルもキャンバスに追加
            await this.addFileToCanvas(uri);

            // 各定義をキャンバスに追加（元ファイルとの関係を記録）
            for (const def of definitions) {
                if ('targetUri' in def) {
                    await this.addDefinitionToCanvas(new vscode.Location(def.targetUri, def.targetRange), uri.fsPath);
                } else {
                    await this.addDefinitionToCanvas(def, uri.fsPath);
                }
            }

            console.log('[Link Canvas] 定義数:', definitions.length, '元ファイル:', uri.fsPath);
        } catch (error) {
            console.error('[Link Canvas] 定義取得エラー:', error);
            vscode.window.showErrorMessage('定義の取得に失敗しました');
        }
    }

    /**
     * エディタコンテキストメニューから呼び出され、参照を取得してキャンバスに追加
     */
    public async handleShowReferencesFromContext(): Promise<void> {
        let editor = vscode.window.activeTextEditor;

        // もしアクティブなエディタがなければ、少し待ってから再試行
        if (!editor) {
            await new Promise(resolve => setTimeout(resolve, 100));
            editor = vscode.window.activeTextEditor;
        }

        if (!editor) {
            vscode.window.showErrorMessage('アクティブなエディタがありません');
            return;
        }

        const uri = editor.document.uri;
        const position = editor.selection.active;

        console.log('[Link Canvas] 参照表示開始:', uri.fsPath, 'Position:', position.line, position.character);

        try {
            // まずキャンバスを開く (ファイル内容はまだ送らない)
            await this.openOrAddFile();

            // 参照情報を取得
            const referencesResult = await vscode.commands.executeCommand<vscode.Location | vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                position
            );

            if (!referencesResult) {
                vscode.window.showInformationMessage('参照が見つかりませんでした');
                return;
            }

            const references = Array.isArray(referencesResult) ? referencesResult : [referencesResult];

            if (references.length === 0) {
                vscode.window.showInformationMessage('参照が見つかりませんでした');
                return;
            }

            // 元のファイルもキャンバスに追加
            await this.addFileToCanvas(uri);

            // 各参照をキャンバスに追加（元ファイルとの関係を記録）
            for (const ref of references) {
                if ('targetUri' in ref) {
                    await this.addReferenceToCanvas(new vscode.Location(ref.targetUri, ref.targetRange), uri.fsPath);
                } else {
                    await this.addReferenceToCanvas(ref, uri.fsPath);
                }
            }

            console.log('[Link Canvas] 参照数:', references.length, '元ファイル:', uri.fsPath);
        } catch (error) {
            console.error('[Link Canvas] 参照取得エラー:', error);
            vscode.window.showErrorMessage('参照の取得に失敗しました');
        }
    }

    /**
     * URIからファイル情報を取得してキャンバスに追加
     */
    private async addFileToCanvas(
        fileUri: vscode.Uri,
        relationshipType?: RelationshipType,
        relatedFilePath?: string
    ): Promise<void> {
        if (!this.panel) {
            console.log('[Link Canvas] Webview Panelが存在しません。addFileToCanvasを中断。');
            return;
        }
        try {
            const fileContent = await vscode.workspace.fs.readFile(fileUri);
            const content = Buffer.from(fileContent).toString('utf8');
            const fileName = fileUri.path.split('/').pop() || 'unknown';

            console.log('[Link Canvas] ファイル送信:', fileName, 'サイズ:', content.length, '関係:', relationshipType);

            this.panel.webview.postMessage({
                type: 'addFile',
                filePath: fileUri.fsPath,
                fileName: fileName,
                content: content,
                relationshipType: relationshipType || null,
                relatedFilePath: relatedFilePath || null,
            });
        } catch (error) {
            console.error('[Link Canvas] ファイル読み込みエラー:', error);
            vscode.window.showErrorMessage('ファイルの読み込みに失敗しました');
        }
    }


    /**
     * Locationオブジェクトからファイル情報を取得してキャンバスに追加する共通メソッド
     */
    private async addLocationToCanvas(
        location: vscode.Location,
        type: '定義' | '参照',
        sourceFilePath?: string
    ): Promise<void> {
        // uriが有効かチェック
        if (!location || !location.uri || typeof location.uri.scheme === 'undefined') {
            console.error(`[Link Canvas] 無効な${type}オブジェクトを受け取りました。処理をスキップします。`, location);
            return;
        }
        try {
            const fileContent = await vscode.workspace.fs.readFile(location.uri);
            const content = Buffer.from(fileContent).toString('utf8');
            const fileName = path.basename(location.uri.fsPath);

            console.log(`[Link Canvas] ${type}ファイルをキャンバスに追加:`, fileName);

            const relationshipType: RelationshipType = type === '定義' ? 'definition' : 'reference';

            // ハイライト範囲情報を送信
            const highlightRange = {
                startLine: location.range.start.line,
                endLine: location.range.end.line,
                startColumn: location.range.start.character,
                endColumn: location.range.end.character,
            };

            this.panel.webview.postMessage({
                type: 'addFile',
                filePath: location.uri.fsPath,
                fileName: fileName,
                content: content,
                highlightLine: location.range.start.line,  // 後方互換性のため保持
                highlightColumn: location.range.start.character,  // 後方互換性のため保持
                highlightRange: highlightRange,  // 新しい範囲情報
                relationshipType: relationshipType,
                relatedFilePath: sourceFilePath || null,
            });

            console.log(`[Link Canvas] ${type}送信完了`, {
                filePath: location.uri.fsPath,
                range: highlightRange,
                relationshipType,
                relatedFilePath: sourceFilePath,
            });
        } catch (error) {
            console.error(`[Link Canvas] ${type}ファイル読み込みエラー:`, error);
        }
    }

    /**
     * Locationからファイル情報を取得してキャンバスに追加
     */
    private async addDefinitionToCanvas(definition: vscode.Location, sourceFilePath?: string): Promise<void> {
        await this.addLocationToCanvas(definition, '定義', sourceFilePath);
    }

    /**
     * Locationからファイル情報を取得してキャンバスに追加
     */
    private async addReferenceToCanvas(reference: vscode.Location, sourceFilePath?: string): Promise<void> {
        await this.addLocationToCanvas(reference, '参照', sourceFilePath);
    }

    /**
     * Webviewからの定義取得リクエストを処理
     */
    private async handleDefinitionRequest(
        message: DefinitionMessage,
        webview: vscode.Webview
    ): Promise<void> {
        try {
            console.log('[Link Canvas] 定義リクエスト処理開始:', {
                filePath: message.filePath,
                line: message.line,
                column: message.column,
            });

            const uri = vscode.Uri.file(message.filePath);
            const position = new vscode.Position(message.line, message.column);

            console.log('[Link Canvas] VSCode API 実行: vscode.executeDefinitionProvider');
            console.log('[Link Canvas] executeDefinitionProvider 呼び出し前 (from Webview):', { uri: uri.fsPath, line: position.line, character: position.column });
            const definitionsResult = await vscode.commands.executeCommand<vscode.Location | vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                uri,
                position
            );
            console.log('[Link Canvas] executeDefinitionProvider 呼び出し後 (from Webview):', definitionsResult);

            console.log('[Link Canvas] 定義取得完了:', {
                count: definitionsResult ? (Array.isArray(definitionsResult) ? definitionsResult.length : 1) : 0,
                selectedText: message.selectedText,
            });

            if (!definitionsResult) {
                console.log('[Link Canvas] 定義が見つかりませんでした');
                return;
            }

            const definitions = Array.isArray(definitionsResult) ? definitionsResult : [definitionsResult];

            if (definitions.length > 0) {
                console.log('[Link Canvas] 定義をキャンバスに追加 (数:', definitions.length, ')');
                for (const def of definitions) {
                    if ('targetUri' in def) {
                        await this.addDefinitionToCanvas(new vscode.Location(def.targetUri, def.targetRange), message.filePath);
                    } else {
                        await this.addDefinitionToCanvas(def, message.filePath);
                    }
                }
                console.log('[Link Canvas] 定義処理完了');
            } else {
                console.log('[Link Canvas] 定義が見つかりませんでした');
            }
        } catch (error) {
            console.error('[Link Canvas] 定義取得エラー:', error);
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
            console.log('[Link Canvas] 参照リクエスト処理開始:', {
                filePath: message.filePath,
                line: message.line,
                column: message.column,
            });

            const uri = vscode.Uri.file(message.filePath);
            const position = new vscode.Position(message.line, message.column);

            console.log('[Link Canvas] VSCode API 実行: vscode.executeReferenceProvider');
            const referencesResult = await vscode.commands.executeCommand<vscode.Location | vscode.Location[]>(
                'vscode.executeReferenceProvider',
                uri,
                position
            );

            console.log('[Link Canvas] 参照取得完了:', {
                count: referencesResult ? (Array.isArray(referencesResult) ? referencesResult.length : 1) : 0,
                selectedText: message.selectedText,
            });

            if (!referencesResult) {
                console.log('[Link Canvas] 参照が見つかりませんでした');
                return;
            }

            const references = Array.isArray(referencesResult) ? referencesResult : [referencesResult];

            if (references.length > 0) {
                console.log('[Link Canvas] 参照をキャンバスに追加 (数:', references.length, ')');
                for (const ref of references) {
                    if ('targetUri' in ref) {
                        await this.addReferenceToCanvas(new vscode.Location(ref.targetUri, ref.targetRange), message.filePath);
                    } else {
                        await this.addReferenceToCanvas(ref, message.filePath);
                    }
                }
                console.log('[Link Canvas] 参照処理完了');
            } else {
                console.log('[Link Canvas] 参照が見つかりませんでした');
            }
        } catch (error) {
            console.error('[Link Canvas] 参照取得エラー:', error);
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
