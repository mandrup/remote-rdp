import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ConnectionModel, isConnectionModel } from '../../models/connection'

export async function createConnection(
    context: vscode.ExtensionContext,
    hostname: string,
    credentialUsername: string,
    group?: string
): Promise<void> {
    const connection: ConnectionModel = {
        id: crypto.randomUUID(),
        hostname,
        credentialUsername,
        group,
        created_at: new Date().toISOString()
    }

    if (!isConnectionModel(connection)) {
        throw new Error('Invalid connection data')
    }

    const connections = Storage.connection.getAll(context)
    if (connections.some((conn: ConnectionModel) => conn.hostname === hostname && conn.credentialUsername === credentialUsername)) {
        throw new Error('A connection with this hostname and credential already exists')
    }
    connections.push(connection)
    await context.globalState.update(PREFIXES.connection, connections)
}