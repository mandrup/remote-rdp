import * as vscode from 'vscode'
import { COMMAND_IDS } from '../constants'
import { ConnectionTreeItem } from '../providers'
import { createDoubleClickHandler } from './shared'
import createConnectionCommand from './connections/create'
import { updateConnectionCommand, updateGroupCredentialsCommand } from './connections/update'
import deleteConnectionCommand from './connections/delete'
import connectConnectionCommand from './connections/connect'
import importConnectionsCommand from './connections/import'
import exportConnectionsCommand from './connections/export'
import createCredentialCommand from './credentials/create'
import updateCredentialCommand from './credentials/update'
import deleteCredentialCommand from './credentials/delete'

let commandsRegistered = false

export function registerCommands(context: vscode.ExtensionContext): void {
    if (commandsRegistered) {
        return
    }

    commandsRegistered = true

    const register = vscode.commands.registerCommand
    const sub = context.subscriptions

    sub.push(register(COMMAND_IDS.connection.create, () => createConnectionCommand(context)))
    sub.push(register(COMMAND_IDS.connection.update, (item?: vscode.TreeItem) => updateConnectionCommand(context, item)))
    sub.push(register(COMMAND_IDS.connection.delete, (item?: vscode.TreeItem) => deleteConnectionCommand(context, item)))
    sub.push(register(COMMAND_IDS.connection.connect,
        createDoubleClickHandler(async (item) => {
            try {
                await connectConnectionCommand(context, item)
            } catch (error) {
                handleCommandError('connect to connection', error)
            }
        })
    ))
    sub.push(register(COMMAND_IDS.connection.import, () => importConnectionsCommand(context)))
    sub.push(register(COMMAND_IDS.connection.export, () => exportConnectionsCommand(context)))
    sub.push(register('remote-rdp:connection:updateGroupCredentialsCommand',
        (item?: ConnectionTreeItem) => updateGroupCredentialsCommand(context, item)
    ))

    sub.push(register(COMMAND_IDS.credential.create, () => createCredentialCommand(context)))
    sub.push(register(COMMAND_IDS.credential.update, (item?: vscode.TreeItem) => updateCredentialCommand(context, item)))
    sub.push(register(COMMAND_IDS.credential.delete, (item?: vscode.TreeItem) => deleteCredentialCommand(context, item)))
}

export async function handleCommandError(operation: string, error: unknown): Promise<void> {
    console.error(`Failed to ${operation}:`, error)
    vscode.window.showErrorMessage(
        `Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`
    )
}