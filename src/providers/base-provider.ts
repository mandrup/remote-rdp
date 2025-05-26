import * as vscode from 'vscode'

export abstract class BaseProvider<T> implements vscode.TreeDataProvider<T> {
    protected readonly _onDidChangeTreeData = new vscode.EventEmitter<T | undefined>()

    readonly onDidChangeTreeData: vscode.Event<T | undefined> = this._onDidChangeTreeData.event

    refresh(item?: T): void {
        try {
            this._onDidChangeTreeData.fire(item)
        } catch (error) {
            console.error('Failed to refresh tree view:', error)
            this._onDidChangeTreeData.fire(undefined)
        }
    }

    abstract getTreeItem(element: T): vscode.TreeItem

    abstract getChildren(element?: T): Thenable<T[]>

    dispose(): void {
        this._onDidChangeTreeData.dispose()
    }
}