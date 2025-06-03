import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'

export async function deleteCredential(context: vscode.ExtensionContext, id: string): Promise<void> {
    const credentials = await Storage.credential.getAll(context)
    if (!credentials.find(c => c.id === id)) {
        return
    }

    const remainingCredentials = credentials.filter(c => c.id !== id)
    const credentialSummaries = remainingCredentials.map(({ id, username, created_at, modified_at }) => ({
        id,
        username,
        created_at,
        modified_at
    }))

    await context.globalState.update(PREFIXES.credential, credentialSummaries)
    await context.secrets.delete(`${PREFIXES.credential}.secret.${id}`)
}