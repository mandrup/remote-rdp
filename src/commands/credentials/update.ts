import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError, refreshViews, validatePromptResult } from '../shared'

export default async function updateCredentialCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const credential = await Prompts.credential.editDetails(context, item)
        if (!validatePromptResult(credential)) {
            return
        }

        const details = await Prompts.credential.details(credential.username)
        if (!validatePromptResult(details)) {
            return
        }

        await Storage.credential.update(context, credential.id, details.username, details.password)

        await refreshViews()
    } catch (error) {
        await handleCommandError('update credential', error)
    }
}