import { getAllConnections } from './connections/get'
import { createConnection } from './connections/create'
import { clearConnectionsCredential, updateConnections, updateConnectionsCredential } from './connections/update'
import { deleteConnection } from './connections/delete'
import { getAllCredentials, getCredentialById, getCredentialWithPasswordById } from './credentials/get'
import { createCredential } from './credentials/create'
import { updateCredential } from './credentials/update'
import { deleteCredential } from './credentials/delete'

export const Storage = {
    connection: {
        getAll: getAllConnections,
        create: createConnection,
        updateAll: updateConnections,
        updateAllCredential: updateConnectionsCredential,
        clearAllCredential: clearConnectionsCredential,
        delete: deleteConnection
    },
    credential: {
        get: getCredentialById,
        getWithPassword: getCredentialWithPasswordById,
        getAll: getAllCredentials,
        create: createCredential,
        update: updateCredential,
        delete: deleteCredential
    }
}