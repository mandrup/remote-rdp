import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { CredentialModel } from '../../models/credential'
import { StorageErrors } from '../shared'
import { ErrorFactory } from '../../errors'

async function updateCredentialMetadata(context: vscode.ExtensionContext, credentials: CredentialModel[]): Promise<void> {
    const credentialSummaries = credentials.map(({ id, username, createdAt: created_at, modifiedAt: modified_at }) => ({
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
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Credential ID', id)
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

    const credentials = await Storage.credential.getAll(context)
    const credentialIndex = credentials.findIndex(c => c.id === id)

    if (credentialIndex === -1) {
        StorageErrors.credentialNotFound(id)
    }

    if (credentials.some(c => c.username === username && c.id !== id)) {
        throw StorageErrors.duplicateCredential(username)
    }

    const now = new Date().toISOString()
    const previous = credentials[credentialIndex]

    credentials[credentialIndex] = {
        id,
        username,
        password,
        createdAt: previous.createdAt,
        modifiedAt: now
    }

    await updateCredentialMetadata(context, credentials)
    await context.secrets.store(`${PREFIXES.credential}.secret.${id}`, password)
}