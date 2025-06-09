import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { Storage } from '..'
import { ErrorFactory } from '../../errors'

export async function deleteCredential(context: vscode.ExtensionContext, id: string): Promise<void> {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        throw ErrorFactory.validation.stringRequired('Credential ID', id)
    }

    const credentials = await Storage.credential.getAll(context)
    if (!credentials.find(c => c.id === id)) {
        return
    }

    const remainingCredentials = credentials.filter(c => c.id !== id)
    const credentialSummaries = remainingCredentials.map(({ id, username, createdAt, modifiedAt }) => ({
        id,
        username,
        created_at: createdAt,
        modified_at: modifiedAt
    }))

    await context.globalState.update(PREFIXES.credential, credentialSummaries)
    await context.secrets.delete(`${PREFIXES.credential}.secret.${id}`)
}