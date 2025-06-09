import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError, validatePromptResult, hasItems } from '../shared'
import { createExportData } from '../../storage/shared'

export default async function exportConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const connections = Storage.connection.getAll(context)
    if (!hasItems(connections)) {
      vscode.window.showWarningMessage('No connections available.')
      return
    }

    const uri = await Prompts.connection.exportFile(
      vscode.Uri.file('connections.json'),
      { 'JSON files': ['json'] }
    )
    if (!validatePromptResult(uri)) {
      return
    }

    const exportedConnections = createExportData(connections)
    const content = JSON.stringify(exportedConnections, null, 2)

    await vscode.workspace.fs.writeFile(uri, Buffer.from(content))
  } catch (error) {
    await handleCommandError('export connection', error)
  }
}