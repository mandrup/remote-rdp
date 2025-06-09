import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ErrorFactory } from '../../errors'
import { ConnectionModel, isConnectionModel } from '../../models/connection'
import { StorageErrors } from '../shared'

export async function createConnection(
    context: vscode.ExtensionContext,
    hostname: string,
    credentialId: string,
    group?: string
): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!hostname || typeof hostname !== 'string' || hostname.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Hostname', hostname)
    }
    if (!credentialId || typeof credentialId !== 'string' || credentialId.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Credential ID', credentialId)
    }
    if (hostname.length > 255) {
        throw ErrorFactory.validation.lengthExceeded('Hostname', 255, hostname.length)
    }
    if (group !== undefined && (typeof group !== 'string' || group.length > 255)) {
        throw ErrorFactory.validation.invalidType('Group', 'string of 255 characters or less', group)
    }

    const connection: ConnectionModel = {
        id: crypto.randomUUID(),
        hostname,
        credentialId,
        group,
        createdAt: new Date().toISOString()
    }

    if (!isConnectionModel(connection)) {
        StorageErrors.invalidConnectionData()
    }

    const connections = Storage.connection.getAll(context)
    if (connections.some((conn: ConnectionModel) => conn.hostname === hostname && conn.credentialId === credentialId)) {
        throw new Error('A connection with this hostname and credential already exists')
    }
    connections.push(connection)
    await context.globalState.update(PREFIXES.connection, connections)
}