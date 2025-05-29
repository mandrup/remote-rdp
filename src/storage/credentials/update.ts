import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'

export async function updateCredential(
    context: vscode.ExtensionContext,
    id: string,
    username: string,
    password: string
): Promise<void> {
    const existing = await Storage.credential.readAll(context)
    const index = existing.findIndex(c => c.id === id)

    if (index === -1) {
        throw new Error(`Credential with ID "${id}" not found`)
    }

    if (existing.some(c => c.username === username && c.id !== id)) {
        throw new Error(`Credential for username "${username}" already exists`)
    }

    existing[index] = { id, username, password }
    const metadata = existing.map(({ id, username }) => ({ id, username }))
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(`${PREFIXES.credential}.secret.${id}`, password)
}

export async function updateCredentialUsername(
    context: vscode.ExtensionContext,
    id: string,
    newUsername: string,
    newPassword: string
): Promise<void> {
    const existing = await Storage.credential.readAll(context)
    const index = existing.findIndex(c => c.id === id)

    if (index === -1) {
        throw new Error(`Credential with ID "${id}" not found`)
    }

    if (existing.some(c => c.username === newUsername && c.id !== id)) {
        throw new Error(`Credential for username "${newUsername}" already exists`)
    }

    existing[index] = { id, username: newUsername, password: newPassword }
    const metadata = existing.map(({ id, username }) => ({ id, username }))
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(`${PREFIXES.credential}.secret.${id}`, newPassword)
}