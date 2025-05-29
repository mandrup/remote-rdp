import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { MESSAGES } from '../../constants'

export default async function exportConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const connections = Storage.connection.readAll(context)
    if (!connections.length) {
      vscode.window.showWarningMessage('No connections available.')
      return
    }

    const uri = await vscode.window.showSaveDialog({
      filters: { 'JSON files': ['json'] },
      defaultUri: vscode.Uri.file('connections.json')
    })

    if (!uri) {
      return
    }

    const exportedConnections = connections.map(({ hostname, group, id }) => ({
      id,
      hostname,
      group
    }))

    const content = JSON.stringify(exportedConnections, null, 2)
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content))
  } catch (error) {
    console.error('Failed to export connections:', error)
    vscode.window.showErrorMessage(MESSAGES.operationFailed('export connections', error))
  }
}