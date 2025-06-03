import * as vscode from 'vscode'

export default abstract class BaseProvider<T> implements vscode.TreeDataProvider<T> {
    private readonly onDidChangeTreeDataEmitter = new vscode.EventEmitter<T | undefined>()
    readonly onDidChangeTreeData: vscode.Event<T | undefined> = this.onDidChangeTreeDataEmitter.event

    refresh(item?: T): void {
        try {
            this.onDidChangeTreeDataEmitter.fire(item)
        } catch (error) {
            console.error('Failed to refresh tree view:', error)
            this.onDidChangeTreeDataEmitter.fire(undefined)
        }
    }

    abstract getTreeItem(element: T): vscode.TreeItem
    abstract getChildren(element?: T): Thenable<T[]>

    dispose(): void {
        this.onDidChangeTreeDataEmitter.dispose()
    }
}