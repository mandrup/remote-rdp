import * as vscode from 'vscode'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { updateCredentialUsername } from '../../storage'
import { updateConnectionsCredential } from '../../storage/connections'
import { promptCredentialToEdit, promptCredentialDetails } from '../../prompts'

export default async function updateCredentialCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const credential = await promptCredentialToEdit(context, item)
        if (!credential) {
            return
        }

        const details = await promptCredentialDetails(credential.username)
        if (!details) {
            return
        }

        await updateCredentialUsername(context, credential.id, details.username, details.password)
        
        await updateConnectionsCredential(context, credential.username, details.username)
        
        //vscode.window.showInformationMessage(MESSAGES.credential.updated(details.username))

        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        console.error('Failed to update credential:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('update credential', error))
    }
}