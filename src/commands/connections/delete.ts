import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'

export default async function deleteConnectionCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const connection = await Prompts.connection.connection(context, item)
        if (!connection) {
            return
        }

        const connections = Storage.connection.readAll(context)
        const updatedConnections = connections.filter(conn => conn.id !== connection.id)
        await Storage.connection.updateAll(context, updatedConnections)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        console.error('Failed to remove connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('remove connection', error))
    }
}