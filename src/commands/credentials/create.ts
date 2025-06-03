import * as vscode from 'vscode'
import { COMMAND_IDS } from '../../constants'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError } from '..'

export default async function createCredentialCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const details = await Prompts.credential.details()
    if (!details) {
      return
    }

    await Storage.credential.create(context, details.username, details.password)

    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
  } catch (error) {
    await handleCommandError('create credential', error)
  }
}