import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '..'

export async function credentialPrompt(
  context: vscode.ExtensionContext,
  current?: string
): Promise<string | undefined> {
  const credentials = await Storage.credential.readAll(context)
  const items = [
    {
      label: '$(add) Create new credential',
      description: 'Create a new credential',
      isCreateNew: true
    },
    ...credentials.map(cred => ({
      label: cred.username,
      description: 'Existing credential',
      isCreateNew: false
    }))
  ]

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a credential or create new',
  })

  if (!selected) {
    return undefined

  }

  if (selected.isCreateNew) {
    const details = await Prompts.credential.credentialDetails()
    if (!details) {
      return undefined
    }
    await Storage.credential.create(context, details.username, details.password)
    return details.username
  }

  return selected.label
}

export async function credentialDetailsPrompt(
  currentUsername?: string
): Promise<{ username: string; password: string } | undefined> {
  const username = await vscode.window.showInputBox({
    prompt: currentUsername ? 'Enter new username' : 'Enter username',
    value: currentUsername,
    placeHolder: 'Enter username'
  })
  if (!username) {
    return undefined
  }

  const password = await vscode.window.showInputBox({
    prompt: currentUsername ? 'Enter new password' : 'Enter password',
    password: true,
    placeHolder: 'Enter password'
  })
  if (!password) {
    return undefined
  }

  return { username, password }
}

export async function editCredentialDetailsPrompt(
  context: vscode.ExtensionContext,
  item?: vscode.TreeItem
): Promise<{ id: string; username: string; password: string } | undefined> {
  const credentials = await Storage.credential.readAll(context)

  if (item?.contextValue === 'emptyCredentials') {
    return undefined
  }

  if (item?.id && typeof item.id === 'string') {
    return credentials.find(c => c.id === item.id)
  }

  if (!credentials.length) {
    vscode.window.showWarningMessage('No credentials available.')
    return undefined
  }

  const selected = await vscode.window.showQuickPick(
    credentials.map(cred => ({
      label: cred.username,
      description: 'Click to edit',
    })),
    { placeHolder: 'Select credential to edit' }
  )

  return selected ? credentials.find(c => c.username === selected.label) : undefined
}