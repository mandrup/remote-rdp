import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'

export function getAllConnections(context: vscode.ExtensionContext): ConnectionModel[] {
    const stored = context.globalState.get<unknown>(PREFIXES.connection, [])
    if (!isConnectionModelArray(stored)) {
        throw new Error('Invalid connection data found in global state storage')
    }
    return stored
}