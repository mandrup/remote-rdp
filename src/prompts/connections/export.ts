import * as vscode from 'vscode'

export async function promptForExportFile(
    defaultUri?: vscode.Uri,
    filters?: { [name: string]: string[] }
): Promise<vscode.Uri | undefined> {
    return vscode.window.showSaveDialog({
        filters,
        defaultUri
    })
}