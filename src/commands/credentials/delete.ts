import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import type { ConnectionModel } from '../../models/connection'
import { handleCommandError, refreshViews, validatePromptResult, hasItems } from '../shared'
import { findConnectionsByCredentialId } from '../../storage/shared'

export default async function deleteCredentialCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
  try {
    const credential = await Prompts.credential.editDetails(context, item)
    if (!validatePromptResult(credential)) {
      return
    }

    const connections = Storage.connection.getAll(context)
    const affectedConnections = findConnectionsByCredentialId(connections, credential.id)

    await Storage.credential.delete(context, credential.id)

    if (hasItems(affectedConnections)) {
      await Storage.connection.clearAllCredential(context, credential.id)
    }

    await refreshViews()
  } catch (error) {
    await handleCommandError('remove credential', error)
  }
}
