import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'

export default async function importConnectionsCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const uri = await Prompts.connection.import({ 'JSON files': ['json'] })
    if (!uri) {
      return
    }

    const content = await vscode.workspace.fs.readFile(uri)
    const json = JSON.parse(content.toString())

    if (!isConnectionModelArray(json)) {
      vscode.window.showErrorMessage('Invalid JSON file.')
      return
    }

    const existingConnections = Storage.connection.readAll(context)
    const importedConnections = json as ConnectionModel[]

    const existingConnectionsMap = new Map(existingConnections.map(conn => [conn.id, conn]))

    const updatedConnections = existingConnections.slice()

    for (const importedConn of importedConnections) {
      const existingConn = existingConnectionsMap.get(importedConn.id)
      if (existingConn) {
        const index = updatedConnections.findIndex(conn => conn.id === importedConn.id)
        updatedConnections[index] = {
          ...existingConn,
          hostname: importedConn.hostname,
          group: importedConn.group
        }
      } else {
        updatedConnections.push(importedConn)
      }
    }

    await Storage.connection.updateAll(context, updatedConnections)

    await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
  } catch (error) {
    if (error instanceof SyntaxError) {
      vscode.window.showErrorMessage('Invalid JSON file.')
    } else {
      console.error('Failed to import connections:', error)
      vscode.window.showErrorMessage(MESSAGES.operationFailed('import connections', error))
    }
  }
}