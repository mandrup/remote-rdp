import * as vscode from 'vscode'
import { PREFIXES } from '../constants'
import { CredentialModel, isCredentialModelArray } from '../models/credential'

export async function readCredentials(context: vscode.ExtensionContext): Promise<CredentialModel[]> {
    const stored = context.globalState.get<{ id: string; username: string }[]>(PREFIXES.credential, [])
    if (!isCredentialModelArray(stored)) {
        throw new Error('Invalid credential data in storage')
    }

    const credentialsWithPasswords = await Promise.all(
        stored.map(async ({ id, username }) => {
            const password = await context.secrets.get(getCredentialSecretKey(id))
            return { id, username, password: password ?? '' }
        })
    )

    return credentialsWithPasswords
}

export async function readCredentialUsernames(context: vscode.ExtensionContext): Promise<string[]> {
    const credentials = await readCredentials(context)
    return credentials.map(c => c.username)
}

export async function createCredential(
    context: vscode.ExtensionContext,
    username: string,
    password: string
): Promise<void> {
    const id = crypto.randomUUID()
    const existing = await readCredentials(context)

    if (existing.some(c => c.username === username)) {
        throw new Error(`Credential for username "${username}" already exists`)
    }

    const metadata = [...existing.map(({ id, username }) => ({ id, username })), { id, username }]
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(getCredentialSecretKey(id), password)
}

export async function updateCredential(
    context: vscode.ExtensionContext,
    id: string,
    username: string,
    password: string
): Promise<void> {
    const existing = await readCredentials(context)
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
    await context.secrets.store(getCredentialSecretKey(id), password)
}

export async function deleteCredential(
    context: vscode.ExtensionContext,
    username: string
): Promise<void> {
    const existing = await readCredentials(context)
    const toDelete = existing.find(c => c.username === username)

    if (!toDelete) {
        return
    }

    const updated = existing.filter(c => c.username !== username)
    const metadata = updated.map(({ id, username }) => ({ id, username }))
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.delete(getCredentialSecretKey(toDelete.id))
}

export async function updateCredentialUsername(
    context: vscode.ExtensionContext,
    id: string,
    newUsername: string,
    newPassword: string
): Promise<void> {
    const existing = await readCredentials(context)
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
    await context.secrets.store(getCredentialSecretKey(id), newPassword)
}

export async function getCredentialWithPassword(
    context: vscode.ExtensionContext,
    username: string
): Promise<{ username: string; password: string } | undefined> {
    const credentials = await readCredentials(context)
    const credential = credentials.find(c => c.username === username)
    
    if (!credential) {
        return undefined
    }

    const password = await context.secrets.get(getCredentialSecretKey(credential.id))
    if (!password) {
        return undefined
    }

    return { username: credential.username, password }
}

function getCredentialSecretKey(id: string): string {
    return `${PREFIXES.credential}.secret.${id}`
}