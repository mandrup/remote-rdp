import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError } from '..'

export default async function exportConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const connections = Storage.connection.getAll(context)
    if (!connections.length) {
      vscode.window.showWarningMessage('No connections available.')
      return
    }

    const uri = await Prompts.connection.exportFile(
      vscode.Uri.file('connections.json'),
      { 'JSON files': ['json'] }
    )
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
    await handleCommandError('export connection', error)
  }
}