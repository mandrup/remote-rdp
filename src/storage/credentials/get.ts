import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { CredentialModel } from '../../models/credential'

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
                typeof (item as any).username === 'string' &&
                typeof (item as any).created_at === 'string' &&
                (typeof (item as any).modified_at === 'string' || (item as any).modified_at === undefined)
        )
}

export async function getAllCredentials(context: vscode.ExtensionContext): Promise<CredentialModel[]> {
    const stored = context.globalState.get<StoredCredentialModel[]>(PREFIXES.credential, [])
    if (!isStoredCredentialModelArray(stored)) {
        throw new Error('Invalid credential data in storage')
    }
    return Promise.all(
        stored.map(async ({ id, username, created_at, modified_at }) => {
            const password = await context.secrets.get(`${PREFIXES.credential}.secret.${id}`)
            return {
                id,
                username,
                password: password ?? '',
                created_at,
                modified_at
            } satisfies CredentialModel
        })
    )
}

export async function getCredentialWithPassword(
    context: vscode.ExtensionContext,
    username: string
): Promise<{ username: string; password: string } | undefined> {
    const credentials = await getAllCredentials(context)
    const credential = credentials.find(c => c.username === username)
    if (!credential || !credential.password) {
        return undefined
    }
    return { username: credential.username, password: credential.password }
}

export async function getAllCredentialUsernames(context: vscode.ExtensionContext): Promise<string[]> {
    const credentials = await getAllCredentials(context)
    return credentials.map(c => c.username)
}