import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ConnectionModel, isConnectionModel } from '../../models/connection'

export default async function createConnection(
    context: vscode.ExtensionContext,
    hostname: string,
    credentialUsername: string,
    group?: string
): Promise<void> {
    const connection: ConnectionModel = {
        id: crypto.randomUUID(),
        hostname,
        credentialUsername,
        group
    }

    if (!isConnectionModel(connection)) {
        throw new Error('Invalid connection data')
    }

    const connections = Storage.connection.readAll(context)
    connections.push(connection)
    await context.globalState.update(PREFIXES.connection, connections)
}