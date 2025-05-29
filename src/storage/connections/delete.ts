import * as vscode from 'vscode'
import { Storage } from '..'

export default async function deleteConnection(
    context: vscode.ExtensionContext,
    id: string
): Promise<void> {
    const connections = Storage.connection.readAll(context)
    const filtered = connections.filter(conn => conn.id !== id)
    await Storage.connection.updateAll(context, filtered)
}