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
        const panel = vscode.window.createWebviewPanel(
            'linkCanvas',
            'Link Canvas',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
            }
        );
        canvasProvider.resolveWebviewView(panel, fileUri);
    });

    context.subscriptions.push(openCanvasCommand);
}

export function deactivate() { }
