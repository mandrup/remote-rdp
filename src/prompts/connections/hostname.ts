import * as vscode from 'vscode'

export default async function promptForHostname(current?: string): Promise<string | undefined> {
    const input = await vscode.window.showInputBox({
        prompt: current ? 'Edit hostname' : 'Enter hostname',
        value: current,
        placeHolder: 'Enter hostname',
    })
    return input || undefined
}