import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'
import { ConnectionGroupItem, ConnectionTreeItem } from '../../providers'

export default async function assignGroupCredentialsCommand(
    context: vscode.ExtensionContext,
    item?: ConnectionTreeItem
): Promise<void> {
    try {
        if (!item || item.type !== 'group') {
            vscode.window.showErrorMessage('This command can only be used on connection groups.')
            return
        }

        const groupItem = item as ConnectionGroupItem
        const credential = await Prompts.credential.credential(context, undefined)
        if (!credential) {
            return
        }

        const connections = Storage.connection.readAll(context)
        const updatedConnections = connections.map(conn => 
            conn.group === groupItem.group
                ? { ...conn, credentialUsername: credential }
                : conn
        )

        await Storage.connection.updateAll(context, updatedConnections)
        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        console.error('Failed to assign credentials to group:', error)
        vscode.window.showErrorMessage('Failed to assign credentials to group.')
    }
} 