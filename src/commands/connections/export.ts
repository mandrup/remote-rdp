import * as vscode from 'vscode'
import { readConnections } from '../../storage/connections'
import { MESSAGES } from '../../constants'

export default async function exportConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const connections = readConnections(context)
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
    //vscode.window.showInformationMessage('Connections exported!')
  } catch (error) {
    console.error('Failed to export connections:', error)
    vscode.window.showErrorMessage(MESSAGES.operationFailed('export connections', error))
  }
}