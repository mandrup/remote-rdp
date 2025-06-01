import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'

export default async function updateConnectionCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const connection = await Prompts.connection.connection(context, item)
        if (!connection) {
            return
        }

        const hostname = await Prompts.connection.hostname(connection.hostname)
        if (!hostname) {
            return
        }

        const groupResult = await Prompts.connection.group(context, connection.group)
        if (groupResult.cancelled) {
            return
        }

        const credentialUsername = await Prompts.credential.credential(context, connection.credentialUsername)

        const connections = Storage.connection.readAll(context)
        const updatedConnections = connections.map(conn =>
            conn.id === connection.id
                ? { ...conn, hostname, credentialUsername, group: groupResult.value }
                : conn
        )
        await Storage.connection.updateAll(context, updatedConnections)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    } catch (error) {
        console.error('Failed to update connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('update connection', error))
    }
}