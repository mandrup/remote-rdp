import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError, refreshViews, validatePromptResult, isGroupPromptCancelled, getGroupValue } from '../shared'

export default async function createConnectionCommand(context: vscode.ExtensionContext): Promise<void> {
    try {
        const hostname = await Prompts.connection.hostname()
        if (!validatePromptResult(hostname)) {
            return
        }

        const groupResult = await Prompts.connection.group(context)
        if (isGroupPromptCancelled(groupResult)) {
            return
        }

        const credentialId = await Prompts.credential.select(context, undefined)
        if (!validatePromptResult(credentialId)) {
            return
        }

        await Storage.connection.create(context, hostname, credentialId, getGroupValue(groupResult))
        await refreshViews()
    } catch (error) {
        await handleCommandError('create connection', error)
    }
}