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

    // Note: Migration is performed asynchronously in the background
    // The function returns immediately with current data and migration happens separately
    migrateConnectionsInBackground(context, [...stored])

    return stored
}

function migrateConnectionsInBackground(context: vscode.ExtensionContext, connections: any[]): void {
    // Run migration asynchronously without blocking the caller
    migrateConnectionsIfNeeded(context, connections).catch(error => {
        console.error('[storage-connections-get] Migration failed:', error)
    })
}

async function migrateConnectionsIfNeeded(
    context: vscode.ExtensionContext,
    connections: any[]
): Promise<void> {
    let needsUpdate = false
    const credentials = await Storage.credential.getAll(context)
    
    for (const connection of connections) {
        // Migrate from credentialUsername to credentialId
        if (connection.credentialUsername && !connection.credentialId) {
            const cred = credentials.find(c => c.username === connection.credentialUsername)
            if (cred) {
                connection.credentialId = cred.id
                needsUpdate = true
            }
            // Always remove credentialUsername after migration attempt
            delete connection.credentialUsername
            needsUpdate = true
        }
        
        // Fix credentialId that contains username instead of ID
        if (connection.credentialId && !credentials.some(c => c.id === connection.credentialId)) {
            // Only attempt to fix if credentialId looks like a username (not a UUID)
            const cred = credentials.find(c => c.username === connection.credentialId)
            if (cred) {
                connection.credentialId = cred.id
                needsUpdate = true
            }
            // If we can't find a matching credential and it doesn't look like a valid ID, clear it
            else if (!connection.credentialId.includes('-')) {
                connection.credentialId = undefined
                needsUpdate = true
            }
        }
        
        // Migrate timestamp naming from snake_case to camelCase
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
        
        // Add createdAt timestamp if missing
        if (!connection.createdAt) {
            connection.createdAt = new Date().toISOString()
            needsUpdate = true
        }
    }
    
    if (needsUpdate) {
        await context.globalState.update(PREFIXES.connection, connections)
    }
}