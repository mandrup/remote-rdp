import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { CredentialModel } from '../../models/credential'
import { StorageErrors } from '../shared'
import { ErrorFactory } from '../../errors'

interface StoredCredentialModel {
    id: string
    username: string
    created_at: string
    modified_at?: string
}

function isStoredCredentialModelArray(value: unknown): value is StoredCredentialModel[] {
    return Array.isArray(value) &&
        value.every(
            item =>
                typeof item === 'object' &&
                item !== null &&
                typeof (item as any).id === 'string' &&
                typeof (item as any).username === 'string'
        )
}

export async function getAllCredentials(context: vscode.ExtensionContext): Promise<CredentialModel[]> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }

    const stored = context.globalState.get<StoredCredentialModel[]>(PREFIXES.credential, [])
    if (!isStoredCredentialModelArray(stored)) {
        throw ErrorFactory.storage.invalidCredentialData()
    }

    await migrateCredentialsIfNeeded(context, stored)

    return Promise.all(
        stored.map(async ({ id, username, created_at, modified_at }) => {
            const password = await context.secrets.get(`${PREFIXES.credential}.secret.${id}`)
            return {
                id,
                username,
                password: password ?? '',
                createdAt: created_at,
                modifiedAt: modified_at
            } satisfies CredentialModel
        })
    )
}

export async function getCredentialById(
    context: vscode.ExtensionContext,
    id: string
): Promise<CredentialModel | undefined> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Credential ID', id)
    }

    const credentials = await getAllCredentials(context)
    return credentials.find(c => c.id === id)
}

export async function getCredentialWithPasswordById(
    context: vscode.ExtensionContext,
    id: string
): Promise<{ id: string; username: string; password: string } | undefined> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Credential ID', id)
    }

    const credential = await getCredentialById(context, id)
    if (!credential || !credential.password) {
        return undefined
    }
    return { id: credential.id, username: credential.username, password: credential.password }
}

export async function getAllCredentialUsernames(context: vscode.ExtensionContext): Promise<string[]> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }

    const credentials = await getAllCredentials(context)
    return credentials.map(c => c.username)
}

async function migrateCredentialsIfNeeded(
    context: vscode.ExtensionContext,
    credentials: StoredCredentialModel[]
): Promise<void> {
    let needsUpdate = false
    for (const credential of credentials) {
        if (!credential.created_at) {
            credential.created_at = new Date().toISOString()
            needsUpdate = true
        }
    }
    if (needsUpdate) {
        await context.globalState.update(PREFIXES.credential, credentials)
    }
}