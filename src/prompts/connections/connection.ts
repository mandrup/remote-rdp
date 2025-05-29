import * as vscode from 'vscode'
import { Storage } from '../../storage'
import type { ConnectionModel } from '../../models/connection'

export default async function connectionPrompt(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<ConnectionModel | undefined> {
    const connections = Storage.connection.readAll(context)

    if (item?.id && typeof item.id === 'string') {
        return connections.find(c => c.id === item.id)
    }

    if (connections.length === 0) {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
    }

    const selected = await vscode.window.showQuickPick(
        connections.map(conn => ({
            label: conn.hostname,
            description: conn.group ? `Group: ${conn.group}` : undefined,
            detail: conn.credentialUsername
                ? `Username: ${conn.credentialUsername}`
                : 'No credential',
            id: conn.id,
        })),
        { placeHolder: 'Select a connection' }
    )

    return selected ? connections.find(c => c.id === selected.id) : undefined
}