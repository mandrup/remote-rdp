import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '..'

interface CredentialQuickPickItem extends vscode.QuickPickItem {
  isCreateNew?: boolean
  isCurrent?: boolean
}

export async function credentialPrompt(
  context: vscode.ExtensionContext,
  currentUsername?: string
): Promise<string | undefined> {
  const credentials = await Storage.credential.readAll(context)
  const items: CredentialQuickPickItem[] = [
    ...credentials
      .map(cred => ({
        label: cred.username,
        description: cred.username === currentUsername ? 'Current' : undefined,
        isCreateNew: false,
        isCurrent: cred.username === currentUsername
      }))
      .sort((a, b) => {
        if (a.isCurrent) {
          return -1
        }
        if (b.isCurrent) {
          return 1
        }
        return a.label.localeCompare(b.label)
      }),
    {
      label: '$(add) Create new credential',
      isCreateNew: true
    }
  ]

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a credential or create new',
    matchOnDescription: true
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