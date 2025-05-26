import * as vscode from 'vscode'
import { MESSAGES, COMMAND_IDS } from '../../constants'
import { createCredential } from '../../storage'
import { promptCredentialDetails } from '../../prompts'

export default async function createCredentialCommand(
  context: vscode.ExtensionContext
): Promise<void> {
  try {
    const details = await promptCredentialDetails()
    if (!details) {
      return
    }

    await createCredential(context, details.username, details.password)
    //vscode.window.showInformationMessage(MESSAGES.credential.created(details.username))
    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
  } catch (error) {
    console.error('Failed to create credential:', error)
    vscode.window.showErrorMessage(MESSAGES.operationFailed('create credential', error))
  }
}