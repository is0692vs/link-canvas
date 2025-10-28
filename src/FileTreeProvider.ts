import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class FileTreeProvider implements vscode.TreeDataProvider<FileItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<FileItem | undefined | void>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: FileItem): vscode.TreeItem {
        return element;
    }

    async getChildren(element?: FileItem): Promise<FileItem[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            return [];
        }

        const rootPath = workspaceFolders[0].uri.fsPath;
        const dirPath = element ? element.resourceUri.fsPath : rootPath;

        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
        return files
            .filter(file => !file.name.startsWith('.'))
            .map(file => {
                const filePath = path.join(dirPath, file.name);
                return new FileItem(
                    file.name,
                    vscode.Uri.file(filePath),
                    file.isDirectory() ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
                );
            });
    }
}

class FileItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly resourceUri: vscode.Uri,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.command = collapsibleState === vscode.TreeItemCollapsibleState.None ? {
            command: 'linkCanvas.openCanvas',
            title: 'Open in Canvas',
            arguments: [resourceUri]
        } : undefined;
    }
}
