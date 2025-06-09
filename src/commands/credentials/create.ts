import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { handleCommandError, refreshCredentials, validatePromptResult } from '../shared'

export default async function createCredentialCommand(context: vscode.ExtensionContext): Promise<void> {
  try {
    const details = await Prompts.credential.details()
    if (!validatePromptResult(details)) {
      return
    }

    await Storage.credential.create(context, details.username, details.password)
    await refreshCredentials()
  } catch (error) {
    await handleCommandError('create credential', error)
  }
}