import readConnections from './connections/read'
import createConnection from './connections/create'
import { clearConnectionsCredential, updateConnections, updateConnectionsCredential } from './connections/update'
import deleteConnection from './connections/delete'
import { getCredentialWithPassword, readCredentials, readCredentialUsernames } from './credentials/read'
import createCredential from './credentials/create'
import { updateCredential, updateCredentialUsername } from './credentials/update'
import deleteCredential from './credentials/delete'


export const Storage = {
    connection: {
        readAll: readConnections,
        create: createConnection,
        updateAll: updateConnections,
        updateAllCredential: updateConnectionsCredential,
        clearAllCredential: clearConnectionsCredential,
        delete: deleteConnection
    },
    credential: {
        readAll: readCredentials,
        readAllUsernames: readCredentialUsernames,
        readWithPassword: getCredentialWithPassword,
        create: createCredential,
        update: updateCredential,
        updateUsername: updateCredentialUsername,
        delete: deleteCredential
    }
}