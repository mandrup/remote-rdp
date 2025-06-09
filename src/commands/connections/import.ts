import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'
import { Prompts } from '../../prompts'
import { handleCommandError, refreshConnections, validatePromptResult } from '../shared'
import { mergeConnections } from '../../storage/shared'

export default async function importConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const uri = await Prompts.connection.importFile({ 'JSON files': ['json'] })
    if (!validatePromptResult(uri)) {
      return
    }

    const content = await vscode.workspace.fs.readFile(uri)
    let json: unknown
    try {
      json = JSON.parse(content.toString())
    } catch (parseError) {
      vscode.window.showErrorMessage('Invalid JSON file.')
      return
    }

    if (!isConnectionModelArray(json)) {
      vscode.window.showErrorMessage('Invalid JSON file.')
      return
    }

    const existingConnections = Storage.connection.getAll(context)
    const importedConnections = json as ConnectionModel[]
    const updatedConnections = mergeConnections(existingConnections, importedConnections)

    await Storage.connection.updateAll(context, updatedConnections)
    await refreshConnections()
  } catch (error) {
    await handleCommandError('import connection', error)
  }
}