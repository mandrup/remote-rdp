import * as vscode from 'vscode'

export default async function exportPrompt(
    defaultUri?: vscode.Uri,
    filters?: { [name: string]: string[] }
): Promise<vscode.Uri | undefined> {
    return vscode.window.showSaveDialog({
        filters,
        defaultUri
    })
}