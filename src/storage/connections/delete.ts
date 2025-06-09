import * as vscode from 'vscode'
import { Storage } from '..'
import { removeConnectionById } from '../shared'
import { ErrorFactory } from '../../errors'

export async function deleteConnection(
    context: vscode.ExtensionContext,
    id: string
): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw ErrorFactory.validation.connectionIdRequired(id)
    }

    const connections = Storage.connection.getAll(context)
    const remainingConnections = removeConnectionById(connections, id)
    await Storage.connection.updateAll(context, remainingConnections)
}