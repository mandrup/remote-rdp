import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'

export default function readConnections(context: vscode.ExtensionContext): ConnectionModel[] {
  const stored = context.globalState.get<unknown>(PREFIXES.connection, [])
  if (!isConnectionModelArray(stored)) {
    throw new Error('Invalid connection data in storage')
  }
  return stored
}