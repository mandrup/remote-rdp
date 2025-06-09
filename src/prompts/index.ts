import { promptForConnection } from './connections/connection'
import promptForHostname from './connections/hostname'
import { promptForGroup } from './connections/group'
import { promptForImportFile } from './connections/import'
import { promptForExportFile } from './connections/export'
import { credentialDetailsPrompt, credentialPrompt, editCredentialDetailsPrompt } from './credentials/credential'

export const Prompts = {
    connection: {
        select: promptForConnection,
        hostname: promptForHostname,
        group: promptForGroup,
        importFile: promptForImportFile,
        exportFile: promptForExportFile
    },
    credential: {
        select: credentialPrompt,
        details: credentialDetailsPrompt,
        editDetails: editCredentialDetailsPrompt,
    }
}