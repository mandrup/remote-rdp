import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'
import { handleCommandError } from '..'

export default async function deleteConnectionCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const connection = await Prompts.connection.select(context, item)
        if (!connection) {
            return
        }

        const connections = Storage.connection.getAll(context)
        const updatedConnections = connections.filter(conn => conn.id !== connection.id)
        await Storage.connection.updateAll(context, updatedConnections)

        await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    } catch (error) {
        await handleCommandError('remove connection', error)
    }
}