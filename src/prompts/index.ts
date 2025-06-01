import connectionPrompt from './connections/connection'
import hostnamePrompt from './connections/hostname'
import groupPrompt from './connections/group'
import importPrompt from './connections/import'
import exportPrompt from './connections/export'
import { credentialDetailsPrompt, credentialPrompt, editCredentialDetailsPrompt } from './credentials/credential'

export const Prompts = {
    connection: {
        connection: connectionPrompt,
        hostname: hostnamePrompt,
        group: groupPrompt,
        import: importPrompt,
        export: exportPrompt
    },
    credential: {
        credential: credentialPrompt,
        credentialDetails: credentialDetailsPrompt,
        editCredentialDetails: editCredentialDetailsPrompt,
    }
}