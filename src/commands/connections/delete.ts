import * as vscode from 'vscode'
import { readConnections, updateConnections } from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { promptConnection } from '../../prompts'

export default async function deleteConnectionCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const connection = await promptConnection(context, item)
        if (!connection) {
            return
        }

        const connections = readConnections(context)
        const updatedConnections = connections.filter(conn => conn.id !== connection.id)
        await updateConnections(context, updatedConnections)
        //vscode.window.showInformationMessage(MESSAGES.connection.deleted(connection.hostname))

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        console.error('Failed to remove connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('remove connection', error))
    }
}