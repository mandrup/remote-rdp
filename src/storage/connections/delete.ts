import * as vscode from 'vscode'
import { Storage } from '..'
import { ConnectionModel } from '../../models/connection'

export async function deleteConnection(
    context: vscode.ExtensionContext,
    id: string
): Promise<void> {
    const connections = Storage.connection.getAll(context)
    const remainingConnections = connections.filter((connection: ConnectionModel) => connection.id !== id)
    await Storage.connection.updateAll(context, remainingConnections)
}