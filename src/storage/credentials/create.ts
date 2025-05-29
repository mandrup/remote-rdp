import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'

export default async function createCredential(
    context: vscode.ExtensionContext,
    username: string,
    password: string
): Promise<void> {
    const id = crypto.randomUUID()
    const existing = await Storage.credential.readAll(context)

    if (existing.some(c => c.username === username)) {
        throw new Error(`Credential for username "${username}" already exists`)
    }

    const metadata = [...existing.map(({ id, username }) => ({ id, username })), { id, username }]
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.store(`${PREFIXES.credential}.secret.${id}`, password)
}