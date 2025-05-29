import * as vscode from 'vscode'
import { registerCommands } from './commands'
import { ConnectionsProvider, ConnectionsDragDropController, CredentialsProvider } from './providers'

export function activate(context: vscode.ExtensionContext) {
    registerCommands(context)

    const connectionsProvider = new ConnectionsProvider(context)
    const dragDropController = new ConnectionsDragDropController(context, () => connectionsProvider.refresh())

    context.subscriptions.push(
        vscode.window.createTreeView('remoteRdpConnections', {
            treeDataProvider: connectionsProvider,
            dragAndDropController: dragDropController
        }),
        vscode.window.registerTreeDataProvider('remoteRdpCredentials', new CredentialsProvider(context))
    )
}


export function deactivate() { }
