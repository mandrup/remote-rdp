import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'
import { ConnectionGroupItem, ConnectionTreeItem } from '../../providers'
import { handleCommandError } from '..'

export async function updateConnectionCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const connection = await Prompts.connection.select(context, item)
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

        const credentialUsername = await Prompts.credential.select(context, connection.credentialUsername)
        if (credentialUsername === undefined) {
            return
        }

        const connections = Storage.connection.getAll(context)

        const updatedConnections = connections.map(conn =>
            conn.id === connection.id
                ? { ...conn, hostname, credentialUsername, group: groupResult.value }
                : conn
        )

        await Storage.connection.updateAll(context, updatedConnections)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
        await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    } catch (error) {
        await handleCommandError('update connection', error)
    }
}

export async function updateGroupCredentialsCommand(context: vscode.ExtensionContext, item?: ConnectionTreeItem): Promise<void> {
    try {
        if (!item || item.type !== 'group') {
            vscode.window.showErrorMessage('This command can only be used on connection groups.')
            return
        }

        const groupItem = item as ConnectionGroupItem
        const credentialUsername = await Prompts.credential.select(context, undefined)
        if (!credentialUsername) {
            return
        }

        const connections = Storage.connection.getAll(context)
        const updatedConnections = connections.map(conn =>
            conn.group === groupItem.group
                ? { ...conn, credentialUsername }
                : conn
        )

        await Storage.connection.updateAll(context, updatedConnections)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        await handleCommandError('update group credentials', error)
    }
}