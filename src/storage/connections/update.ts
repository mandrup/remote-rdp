import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'
import { clearCredentialFromConnections, findConnectionsByCredentialId, updateConnectionsCredentialId } from '../shared'
import { ErrorFactory } from '../../errors'

export async function updateConnections(
    context: vscode.ExtensionContext,
    connections: ConnectionModel[]
): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!Array.isArray(connections)) {
        throw ErrorFactory.validation.connectionsArrayRequired(connections)
    }

    if (!isConnectionModelArray(connections)) {
        throw ErrorFactory.storage.invalidConnectionArray()
    }
    await context.globalState.update(PREFIXES.connection, connections)
    const stored = context.globalState.get<unknown>(PREFIXES.connection)
    if (!isConnectionModelArray(stored)) {
        throw ErrorFactory.storage.storedDataInvalid()
    }
}

export async function updateConnectionsCredential(
    context: vscode.ExtensionContext,
    oldCredentialId: string,
    newCredentialId: string
): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!oldCredentialId || typeof oldCredentialId !== 'string' || oldCredentialId.trim().length === 0) {
        throw ErrorFactory.validation.oldCredentialIdRequired(oldCredentialId)
    }
    if (!newCredentialId || typeof newCredentialId !== 'string' || newCredentialId.trim().length === 0) {
        throw ErrorFactory.validation.newCredentialIdRequired(newCredentialId)
    }

    const connections = Storage.connection.getAll(context) || []
    const updatedConnections = updateConnectionsCredentialId(connections, oldCredentialId, newCredentialId)
    await updateConnections(context, updatedConnections)
}

export async function clearConnectionsCredential(
    context: vscode.ExtensionContext,
    credentialId: string
): Promise<number> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!credentialId || typeof credentialId !== 'string' || credentialId.trim().length === 0) {
        throw ErrorFactory.validation.credentialIdRequired(credentialId)
    }

    const connections = Storage.connection.getAll(context) || []
    const affectedConnections = findConnectionsByCredentialId(connections, credentialId)
    const updatedConnections = clearCredentialFromConnections(connections, credentialId)
    await updateConnections(context, updatedConnections)
    return affectedConnections.length
}