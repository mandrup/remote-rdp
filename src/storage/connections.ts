import * as vscode from 'vscode'
import { PREFIXES } from '../constants'
import { ConnectionModel, isConnectionModel, isConnectionModelArray } from '../models/connection'

export function readConnections(context: vscode.ExtensionContext): ConnectionModel[] {
  const stored = context.globalState.get<unknown>(PREFIXES.connection, [])
  if (!isConnectionModelArray(stored)) {
    throw new Error('Invalid connection data in storage')
  }
  return stored
}

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
    group
  }

  if (!isConnectionModel(connection)) {
    throw new Error('Invalid connection data')
  }

  const connections = readConnections(context)
  connections.push(connection)
  await context.globalState.update(PREFIXES.connection, connections)
}

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
  const connections = readConnections(context)
  const updated = connections.map(conn =>
    conn.credentialUsername === oldUsername
      ? { ...conn, credentialUsername: newUsername }
      : conn
  )
  await updateConnections(context, updated)
}

export async function deleteConnection(
  context: vscode.ExtensionContext,
  id: string
): Promise<void> {
  const connections = readConnections(context)
  const filtered = connections.filter(conn => conn.id !== id)
  await updateConnections(context, filtered)
}

export async function clearConnectionsCredential(
  context: vscode.ExtensionContext,
  username: string
): Promise<number> {
  const connections = readConnections(context)
  const affectedCount = connections.filter(conn => conn.credentialUsername === username).length
  const updated = connections.map(conn =>
    conn.credentialUsername === username
      ? { ...conn, credentialUsername: undefined }
      : conn
  )
  await updateConnections(context, updated)
  return affectedCount
}