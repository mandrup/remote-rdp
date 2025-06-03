import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'

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
    const existing = await Storage.credential.getAll(context)

    if (existing.some(c => c.username === username)) {
        throw new Error(`Credential for username "${username}" already exists`)
    }

    const credential: CredentialMetadata = {
        id: crypto.randomUUID(),
        username,
        created_at: new Date().toISOString()
    }

    const metadata: CredentialMetadata[] = [
        ...existing.map(({ id, username, created_at }) => ({
            id,
            username,
            created_at
        })),
        credential
    ]

    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(`${PREFIXES.credential}.secret.${credential.id}`, password)
}