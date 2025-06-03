import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { CredentialModel } from '../../models/credential'

async function updateCredentialMetadata(context: vscode.ExtensionContext, credentials: CredentialModel[]): Promise<void> {
    const credentialSummaries = credentials.map(({ id, username, created_at, modified_at }) => ({
        id,
        username,
        created_at,
        modified_at
    }))
    await context.globalState.update(PREFIXES.credential, credentialSummaries)
}

export async function updateCredential(
    context: vscode.ExtensionContext,
    id: string,
    username: string,
    password: string
): Promise<void> {
    const credentials = await Storage.credential.getAll(context)
    const credentialIndex = credentials.findIndex(c => c.id === id)

    if (credentialIndex === -1) {
        throw new Error(`Credential with ID "${id}" not found`)
    }

    if (credentials.some(c => c.username === username && c.id !== id)) {
        throw new Error(`Credential for username "${username}" already exists`)
    }

    const now = new Date().toISOString()
    const previous = credentials[credentialIndex]

    credentials[credentialIndex] = {
        id,
        username,
        password,
        created_at: previous.created_at,
        modified_at: now
    }

    await updateCredentialMetadata(context, credentials)
    await context.secrets.store(`${PREFIXES.credential}.secret.${id}`, password)
}