import type { ConnectionModel } from '../models/connection'
import { ERROR_MESSAGES } from '../constants'
import { ErrorFactory } from '../errors'

export function removeConnectionById(connections: ConnectionModel[], connectionId: string): ConnectionModel[] {
    return connections.filter(conn => conn.id !== connectionId)
}

export function updateConnectionById(
    connections: ConnectionModel[], 
    connectionId: string, 
    updates: Partial<ConnectionModel>
): ConnectionModel[] {
    return connections.map(conn =>
        conn.id === connectionId ? { 
            ...conn, 
            ...updates, 
            modifiedAt: new Date().toISOString() 
        } : conn
    )
}

export function findConnectionsByCredentialId(connections: ConnectionModel[], credentialId: string): ConnectionModel[] {
    return connections.filter(connection => connection.credentialId === credentialId)
}

export function updateGroupCredentials(connections: ConnectionModel[], groupName: string, newCredentialId: string): ConnectionModel[] {
    const now = new Date().toISOString()
    return connections.map(conn =>
        conn.group === groupName ? { 
            ...conn, 
            credentialId: newCredentialId,
            modifiedAt: now
        } : conn
    )
}

export function updateConnectionsCredentialId(connections: ConnectionModel[], oldCredentialId: string, newCredentialId: string): ConnectionModel[] {
    const now = new Date().toISOString()
    return connections.map(conn =>
        conn.credentialId === oldCredentialId ? { 
            ...conn, 
            credentialId: newCredentialId,
            modifiedAt: now
        } : conn
    )
}

export function mergeConnections(existingConnections: ConnectionModel[], newConnections: ConnectionModel[]): ConnectionModel[] {
    const result = [...existingConnections]
    const now = new Date().toISOString()
    
    for (const newConn of newConnections) {
        const existingIndex = result.findIndex(conn => conn.id === newConn.id)
        if (existingIndex >= 0) {
            result[existingIndex] = { ...result[existingIndex], ...newConn, modifiedAt: now }
        } else {
            result.push(newConn)
        }
    }
    
    return result
}

export function clearCredentialFromConnections(connections: ConnectionModel[], credentialId: string): ConnectionModel[] {
    const now = new Date().toISOString()
    return connections.map(conn =>
        conn.credentialId === credentialId ? { 
            ...conn, 
            credentialId: undefined,
            modifiedAt: now
        } : conn
    )
}

export function createExportData(connections: ConnectionModel[]): Pick<ConnectionModel, 'id' | 'hostname' | 'group'>[] {
    return connections.map(({ hostname, group, id }) => ({
        id,
        hostname,
        group
    }))
}

export const StorageErrors = {
    invalidCredentialData(): never {
        throw ErrorFactory.storage.invalidCredentialData()
    },
    
    invalidConnectionData(): never {
        throw ErrorFactory.storage.invalidConnectionData()
    },
    
    storedDataInvalid(): never {
        throw ErrorFactory.storage.storedDataInvalid()
    },
    
    credentialNotFound(id: string): never {
        throw ErrorFactory.storage.credentialNotFound(id)
    },

    connectionNotFound(id: string): never {
        throw ErrorFactory.storage.connectionNotFound(id)
    },

    duplicateCredential(username: string): never {
        throw ErrorFactory.storage.duplicateCredential(username)
    },

    duplicateConnection(hostname: string): never {
        throw ErrorFactory.storage.duplicateConnection(hostname)
    }
}
