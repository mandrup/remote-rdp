import * as vscode from 'vscode'
import { createConnection as createConnectionStorage } from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { promptHostname, promptCredential, promptGroup } from '../../prompts'

export default async function createConnectionCommand(context: vscode.ExtensionContext): Promise<void> {
    try {
        const hostname = await promptHostname()
        if (!hostname) {
            return
        }

        const groupResult = await promptGroup(context)
        if (groupResult.cancelled) {
            return
        }

        const credential = await promptCredential(context)
        if (!credential) {
            return
        }

        await createConnectionStorage(context, hostname, credential, groupResult.value)
        //vscode.window.showInformationMessage(MESSAGES.connection.created(hostname, groupResult.value))

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    } catch (error) {
        console.error('Failed to create connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('create connection', error))
    }
}
