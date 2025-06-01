import * as vscode from 'vscode'

export default async function importPrompt(
    filters?: { [name: string]: string[] }
): Promise<vscode.Uri | undefined> {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters
    })
    return uris?.[0]
}
