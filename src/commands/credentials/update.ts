import * as vscode from 'vscode'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'

export default async function updateCredentialCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const credential = await Prompts.credential.editCredentialDetails(context, item)
        if (!credential) {
            return
        }

        const details = await Prompts.credential.credentialDetails(credential.username)
        if (!details) {
            return
        }

        await Storage.credential.updateUsername(context, credential.id, details.username, details.password)

        await Storage.connection.updateAllCredential(context, credential.username, details.username)

        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        console.error('Failed to update credential:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('update credential', error))
    }
}