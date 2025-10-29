import * as vscode from 'vscode';
import { FileTreeProvider } from './FileTreeProvider';
import { CanvasViewProvider } from './CanvasViewProvider';

export function activate(context: vscode.ExtensionContext) {
    // File Tree Provider
    const fileTreeProvider = new FileTreeProvider();
    vscode.window.registerTreeDataProvider('linkCanvas.fileTree', fileTreeProvider);

    // Canvas View Provider
    const canvasProvider = new CanvasViewProvider(context.extensionUri);

    // Open Canvas Command
    const openCanvasCommand = vscode.commands.registerCommand('linkCanvas.openCanvas', async (fileUri: vscode.Uri) => {
        console.log('[Link Canvas] openCanvasコマンド実行:', fileUri.fsPath);
        await canvasProvider.openOrAddFile(fileUri);
    });

    // Show Definition Command（エディタコンテキストメニューから）
    const showDefinitionCommand = vscode.commands.registerCommand('linkCanvas.showDefinition', async () => {
        console.log('[Link Canvas] showDefinitionコマンド実行');
        await canvasProvider.handleShowDefinitionFromContext();
    });

    // Show References Command（エディタコンテキストメニューから）
    const showReferencesCommand = vscode.commands.registerCommand('linkCanvas.showReferences', async () => {
        console.log('[Link Canvas] showReferencesコマンド実行');
        await canvasProvider.handleShowReferencesFromContext();
    });

    // Zoom In Command
    const zoomInCommand = vscode.commands.registerCommand('linkCanvas.zoomIn', () => {
        console.log('[Link Canvas] Zoom In コマンド実行');
        canvasProvider.sendZoomCommand('zoomIn');
    });

    // Zoom Out Command
    const zoomOutCommand = vscode.commands.registerCommand('linkCanvas.zoomOut', () => {
        console.log('[Link Canvas] Zoom Out コマンド実行');
        canvasProvider.sendZoomCommand('zoomOut');
    });

    context.subscriptions.push(openCanvasCommand, showDefinitionCommand, showReferencesCommand, zoomInCommand, zoomOutCommand);
}

export function deactivate() { }
