import * as vscode from 'vscode'
import { Storage } from '../../storage'
import type { ConnectionModel } from '../../models/connection'

export async function promptForConnection(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<ConnectionModel | undefined> {
    const connections = Storage.connection.getAll(context)

    if (item?.id && typeof item.id === 'string') {
        return connections.find(c => c.id === item.id)
    }

    if (connections.length === 0) {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
    }

    const selected = await vscode.window.showQuickPick(
        connections.map(connection => ({
            label: connection.hostname,
            description: connection.group ? `Group: ${connection.group}` : undefined,
            id: connection.id,
        })),
        { placeHolder: 'Select a connection' }
    )

    return selected && selected.id ? connections.find(c => c.id === selected.id) : undefined
}