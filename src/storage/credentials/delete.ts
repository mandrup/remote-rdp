import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'

export default async function deleteCredential(
    context: vscode.ExtensionContext,
    username: string
): Promise<void> {
    const existing = await Storage.credential.readAll(context)
    const toDelete = existing.find(c => c.username === username)

    if (!toDelete) {
        return
    }

    const updated = existing.filter(c => c.username !== username)
    const metadata = updated.map(({ id, username }) => ({ id, username }))
    await context.globalState.update(PREFIXES.credential, metadata)
    await context.secrets.delete(`${PREFIXES.credential}.secret.${toDelete.id}`)
}