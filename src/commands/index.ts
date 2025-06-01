import * as vscode from 'vscode'
import { COMMAND_IDS } from '../constants'
import createConnectionCommand from './connections/create'
import updateConnectionCommand from './connections/update'
import deleteConnectionCommand from './connections/delete'
import connectConnectionCommand from './connections/connect'
import importConnectionsCommand from './connections/import'
import exportConnectionsCommand from './connections/export'
import assignGroupCredentialsCommand from './connections/assign-group-credentials'
import createCredentialCommand from './credentials/create'
import updateCredentialCommand from './credentials/update'
import deleteCredentialCommand from './credentials/delete'
import { ConnectionTreeItem } from '../providers'

let commandsRegistered = false

export async function handleCommandError(operation: string, error: unknown): Promise<void> {
    console.error(`Failed to ${operation}:`, error)
    vscode.window.showErrorMessage(`Failed to ${operation}: ${error instanceof Error ? error.message : String(error)}`)
}

let lastClickTime = 0
let lastClickedId: string | undefined = undefined
const DOUBLE_CLICK_DELAY = 300 // ms

export function registerCommands(context: vscode.ExtensionContext): void {
    if (commandsRegistered) {
        return
    }
    commandsRegistered = true

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_IDS.connection.create, () => createConnectionCommand(context)),
        vscode.commands.registerCommand(COMMAND_IDS.connection.update, (item?: vscode.TreeItem) => updateConnectionCommand(context, item)),
        vscode.commands.registerCommand(COMMAND_IDS.connection.delete, (item?: vscode.TreeItem) => deleteConnectionCommand(context, item)),
        vscode.commands.registerCommand(COMMAND_IDS.connection.connect, async (itemOrOptions?: any) => {
            // No argument = icon button clicked => connect immediately
            if (!itemOrOptions) {
                try {
                    await connectConnectionCommand(context, undefined)
                } catch (error) {
                    handleCommandError('connect to connection', error)
                }
                return
            }

            // Otherwise, expect a tree item with 'id'
            if (!('id' in itemOrOptions)) {
                return
            }

            const now = Date.now()
            const id = itemOrOptions.id as string

            if (lastClickedId === id && (now - lastClickTime) < DOUBLE_CLICK_DELAY) {
                // Double click detected
                lastClickTime = 0
                lastClickedId = undefined

                try {
                    await connectConnectionCommand(context, itemOrOptions)
                } catch (error) {
                    handleCommandError('connect to connection', error)
                }
            } else {
                lastClickedId = id
                lastClickTime = now

                setTimeout(() => {
                    if (Date.now() - lastClickTime >= DOUBLE_CLICK_DELAY) {
                        lastClickedId = undefined
                        lastClickTime = 0
                    }
                }, DOUBLE_CLICK_DELAY)
            }
        }),
        vscode.commands.registerCommand(COMMAND_IDS.connection.import, () => importConnectionsCommand(context)),
        vscode.commands.registerCommand(COMMAND_IDS.connection.export, () => exportConnectionsCommand(context)),
        vscode.commands.registerCommand('remote-rdp:connection:assignGroupCredentials', (item?: ConnectionTreeItem) => assignGroupCredentialsCommand(context, item))
    )

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_IDS.credential.create, () => createCredentialCommand(context)),
        vscode.commands.registerCommand(COMMAND_IDS.credential.update, (item?: vscode.TreeItem) => updateCredentialCommand(context, item)),
        vscode.commands.registerCommand(COMMAND_IDS.credential.delete, (item?: vscode.TreeItem) => deleteCredentialCommand(context, item))
    )
}
