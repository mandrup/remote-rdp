import * as vscode from 'vscode'
import { PREFIXES } from '../../constants'
import { ConnectionModel, isConnectionModelArray } from '../../models/connection'
import { Storage } from '../../storage'
import { ErrorFactory } from '../../errors'

export function getAllConnections(context: vscode.ExtensionContext): ConnectionModel[] {
    if (!context) {
        throw ErrorFactory.validation.contextRequired()
    }

    const stored = context.globalState.get<unknown>(PREFIXES.connection, [])
    if (!isConnectionModelArray(stored)) {
        throw ErrorFactory.storage.invalidConnectionData()
    }

    migrateConnectionsIfNeeded(context, [...stored])
        .then(migrationOccurred => {
            if (migrationOccurred && !process.env.VSCODE_TEST) {
                vscode.commands.executeCommand('remote-rdp:connection:refresh')
            }
        })
        .catch(console.error)

    return stored
}

async function migrateConnectionsIfNeeded(
    context: vscode.ExtensionContext,
    connections: any[]
): Promise<boolean> {
    let needsUpdate = false
    const credentials = await Storage.credential.getAll(context)
    
    for (const connection of connections) {
        if (connection.credentialUsername && !connection.credentialId) {
            const cred = credentials.find(c => c.username === connection.credentialUsername)
            if (cred) {
                connection.credentialId = cred.id
                needsUpdate = true
            }
            delete connection.credentialUsername
            needsUpdate = true
        }
        
        if (connection.credentialId && !credentials.some(c => c.id === connection.credentialId)) {
            const cred = credentials.find(c => c.username === connection.credentialId)
            if (cred) {
                connection.credentialId = cred.id
                needsUpdate = true
            }
            else if (!connection.credentialId.includes('-')) {
                connection.credentialId = undefined
                needsUpdate = true
            }
        }
        
        if (connection.created_at && !connection.createdAt) {
            connection.createdAt = connection.created_at
            delete connection.created_at
            needsUpdate = true
        }
        if (connection.modified_at && !connection.modifiedAt) {
            connection.modifiedAt = connection.modified_at
            delete connection.modified_at
            needsUpdate = true
        }
        
        if (!connection.createdAt) {
            connection.createdAt = new Date().toISOString()
            needsUpdate = true
        }
    }
    
    if (needsUpdate) {
        await context.globalState.update(PREFIXES.connection, connections)
    }
    
    return needsUpdate
}