import * as vscode from 'vscode'
import { COMMAND_IDS } from '../../constants'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError } from '..'

export default async function updateCredentialCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const credential = await Prompts.credential.editDetails(context, item)
        if (!credential) {
            return
        }

        const details = await Prompts.credential.details(credential.username)
        if (!details) {
            return
        }

        await Storage.credential.update(context, credential.id, details.username, details.password)
        await Storage.connection.updateAllCredential(context, credential.username, details.username)

        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        await handleCommandError('update credential', error)
    }
}