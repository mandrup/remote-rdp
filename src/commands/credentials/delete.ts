import * as vscode from 'vscode'
import {
  readConnections,
  clearConnectionsCredential,
  deleteCredential
} from '../../storage'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { promptCredentialToEdit } from '../../prompts'
import type { ConnectionModel } from '../../models/connection'

export default async function deleteCredentialCommand(
  context: vscode.ExtensionContext,
  item?: vscode.TreeItem
): Promise<void> {
  try {
    const credential = await promptCredentialToEdit(context, item)
    if (!credential) {
      return
    }

    const connections = readConnections(context)
    const affectedConnections = connections.filter(
      (conn: ConnectionModel) => conn.credentialUsername === credential.username
    )

    await deleteCredential(context, credential.username)

    if (affectedConnections.length > 0) {
      await clearConnectionsCredential(context, credential.username)
    }

    //vscode.window.showInformationMessage(MESSAGES.credential.deleted(credential.username))

    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
  } catch (error) {
    console.error('Failed to remove credential:', error)
    vscode.window.showErrorMessage(
      MESSAGES.operationFailed('remove credential', error)
    )
  }
}
