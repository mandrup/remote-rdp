import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'

export async function updateConnections(
    context: vscode.ExtensionContext,
    connections: ConnectionModel[]
): Promise<void> {
    if (!isConnectionModelArray(connections)) {
        throw new Error('Invalid connection data array')
    }
    await context.globalState.update(PREFIXES.connection, connections)
    const stored = context.globalState.get<unknown>(PREFIXES.connection)
    if (!isConnectionModelArray(stored)) {
        throw new Error('Stored connection data is invalid after update')
    }
}

export async function updateConnectionsCredential(
    context: vscode.ExtensionContext,
    oldUsername: string,
    newUsername: string
): Promise<void> {
    const connections = Storage.connection.getAll(context) || []
    const updatedConnections = connections.map((connection: ConnectionModel) =>
        connection.credentialUsername === oldUsername
            ? { ...connection, credentialUsername: newUsername }
            : connection
    )
    await updateConnections(context, updatedConnections)
}

export async function clearConnectionsCredential(
    context: vscode.ExtensionContext,
    username: string
): Promise<number> {
    const connections = Storage.connection.getAll(context) || []
    const affectedCount = connections.filter((connection: ConnectionModel) => connection.credentialUsername === username).length
    const updatedConnections = connections.map((connection: ConnectionModel) =>
        connection.credentialUsername === username
            ? { ...connection, credentialUsername: undefined }
            : connection
    )
    await updateConnections(context, updatedConnections)
    return affectedCount
}