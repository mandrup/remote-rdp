import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { ConnectionsProvider, CredentialsProvider } from './providers'

export function activate(context: vscode.ExtensionContext) {
    registerCommands(context)

    const connectionsProvider = new ConnectionsProvider(context)
    context.subscriptions.push(
        vscode.window.createTreeView('remoteRdpConnections', {
            treeDataProvider: connectionsProvider,
            dragAndDropController: connectionsProvider
        }),
        vscode.window.registerTreeDataProvider('remoteRdpCredentials', new CredentialsProvider(context))
    )
}

export function deactivate() { }   