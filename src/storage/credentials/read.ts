import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { CredentialModel, isCredentialModelArray } from '../../models/credential'

export async function readCredentials(context: vscode.ExtensionContext): Promise<CredentialModel[]> {
    const stored = context.globalState.get<{ id: string; username: string }[]>(PREFIXES.credential, [])
    if (!isCredentialModelArray(stored)) {
        throw new Error('Invalid credential data in storage')
    }

    const credentialsWithPasswords = await Promise.all(
        stored.map(async ({ id, username }) => {
            const password = await context.secrets.get(`${PREFIXES.credential}.secret.${id}`)
            return { id, username, password: password ?? '' }
        })
    )

    return credentialsWithPasswords
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

    const password = await context.secrets.get(`${PREFIXES.credential}.secret.${credential.id}`)
    if (!password) {
        return undefined
    }

    return { username: credential.username, password }
}

export async function readCredentialUsernames(context: vscode.ExtensionContext): Promise<string[]> {
    const credentials = await readCredentials(context)
    return credentials.map(c => c.username)
}