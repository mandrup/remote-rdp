import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { StorageErrors } from '../shared'
import { ErrorFactory } from '../../errors'

interface CredentialMetadata {
    id: string
    username: string
    created_at: string
}

export async function createCredential(
    context: vscode.ExtensionContext,
    username: string,
    password: string
): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Username', username)
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Password', password)
    }
    if (username.length > 255) {
        throw ErrorFactory.validation.lengthExceeded('Username', 255, username.length)
    }
    if (password.length > 1000) {
        throw ErrorFactory.validation.lengthExceeded('Password', 1000, password.length)
    }

    const existing = await Storage.credential.getAll(context)

    if (existing.some(c => c.username === username)) {
        throw StorageErrors.duplicateCredential(username)
    }

    const credential: CredentialMetadata = {
        id: crypto.randomUUID(),
        username,
        created_at: new Date().toISOString()
    }

    const metadata: CredentialMetadata[] = [
        ...existing.map(({ id, username, createdAt }) => ({
            id,
            username,
            created_at: createdAt ?? ''
        })),
        credential
    ]

    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(`${PREFIXES.credential}.secret.${credential.id}`, password)
}