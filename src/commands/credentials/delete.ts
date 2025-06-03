import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { Prompts } from '../../prompts'
import type { ConnectionModel } from '../../models/connection'
import { handleCommandError } from '..'

export default async function deleteCredentialCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
  try {
    const credential = await Prompts.credential.editDetails(context, item)
    if (!credential) {
      return
    }

    const connections = Storage.connection.getAll(context)
    const affectedConnections = connections.filter(
      (conn: ConnectionModel) => conn.credentialUsername === credential.username
    )

    await Storage.credential.delete(context, credential.username)

    if (affectedConnections.length > 0) {
      await Storage.connection.clearAllCredential(context, credential.username)
    }

    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
    await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
  } catch (error) {
    await handleCommandError('remove credential', error)
  }
}
