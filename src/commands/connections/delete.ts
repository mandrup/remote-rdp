import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError, refreshConnections, validatePromptResult } from '../shared'
import { removeConnectionById } from '../../storage/shared'

export default async function deleteConnectionCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const connection = await Prompts.connection.select(context, item)
        if (!validatePromptResult(connection)) {
            return
        }

        const connections = Storage.connection.getAll(context)
        const updatedConnections = removeConnectionById(connections, connection.id)
        await Storage.connection.updateAll(context, updatedConnections)

        await refreshConnections()
    } catch (error) {
        await handleCommandError('remove connection', error)
    }
}