import * as vscode from 'vscode'
import { readConnections, updateConnections } from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { promptConnection, promptHostname, promptCredential, promptGroup } from '../../prompts'

export default async function updateConnectionCommand(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<void> {
    try {
        const connection = await promptConnection(context, item)
        if (!connection) {
            return
        }

        
        const hostname = await promptHostname(connection.hostname)
        if (!hostname) {
            return
        }
        
        const groupResult = await promptGroup(context, connection.group)
        if (groupResult.cancelled) {
            return
        }

        const credentialUsername = await promptCredential(context, connection.credentialUsername)
        
        const connections = readConnections(context)
        const updatedConnections = connections.map(conn =>
            conn.id === connection.id
                ? { ...conn, hostname, credentialUsername, group: groupResult.value }
                : conn
        )
        await updateConnections(context, updatedConnections)
        //vscode.window.showInformationMessage(MESSAGES.connection.updated(hostname))

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    } catch (error) {
        console.error('Failed to update connection:', error)
        vscode.window.showErrorMessage(MESSAGES.operationFailed('update connection', error))
    }
}