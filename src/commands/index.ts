import * as vscode from 'vscode'
import { COMMAND_IDS } from '../constants'

// Connection commands
import createConnectionCommand from './connections/create'
import updateConnectionCommand from './connections/update'
import deleteConnectionCommand from './connections/delete'
import connectConnectionCommand from './connections/connect'
import importConnectionsCommand from './connections/import'
import exportConnectionsCommand from './connections/export'

// Credential commands
import createCredentialCommand from './credentials/create'
import updateCredentialCommand from './credentials/update'
import deleteCredentialCommand from './credentials/delete'
//import { pickCredential } from './credentials/pick'

let commandsRegistered = false

export function registerCommands(context: vscode.ExtensionContext): void {
  if (commandsRegistered) { return }
  commandsRegistered = true

  // Connection commands
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_IDS.connection.create, () => createConnectionCommand(context)),
    vscode.commands.registerCommand(COMMAND_IDS.connection.update, (item?: vscode.TreeItem) => updateConnectionCommand(context, item)),
    vscode.commands.registerCommand(COMMAND_IDS.connection.delete, (item?: vscode.TreeItem) => deleteConnectionCommand(context, item)),
    vscode.commands.registerCommand(COMMAND_IDS.connection.connect, (item?: vscode.TreeItem) => connectConnectionCommand(context, item)),
    vscode.commands.registerCommand(COMMAND_IDS.connection.import, () => importConnectionsCommand(context)),
    vscode.commands.registerCommand(COMMAND_IDS.connection.export, () => exportConnectionsCommand(context))
  )

  // Credential commands
  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_IDS.credential.create, () => createCredentialCommand(context)),
    vscode.commands.registerCommand(COMMAND_IDS.credential.update, (item?: vscode.TreeItem) => updateCredentialCommand(context, item)),
    vscode.commands.registerCommand(COMMAND_IDS.credential.delete, (item?: vscode.TreeItem) => deleteCredentialCommand(context, item))
  )
}