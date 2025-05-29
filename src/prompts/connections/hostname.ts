import * as vscode from 'vscode'

export default async function hostnamePrompt(current?: string): Promise<string | undefined> {
    const hostname = await vscode.window.showInputBox({
        prompt: current ? 'Edit hostname' : 'Enter hostname',
        value: current,
        placeHolder: 'Enter hostname',
    })

    if (!hostname) {
        return undefined
    }

    return hostname
}