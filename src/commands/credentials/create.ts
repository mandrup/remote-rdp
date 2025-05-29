import * as vscode from 'vscode'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'

export default async function createCredentialCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const details = await Prompts.credential.credentialDetails()
    if (!details) {
      return
    }

    await Storage.credential.create(context, details.username, details.password)
    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
  } catch (error) {
    console.error('Failed to create credential:', error)
    vscode.window.showErrorMessage(MESSAGES.operationFailed('create credential', error))
  }
}