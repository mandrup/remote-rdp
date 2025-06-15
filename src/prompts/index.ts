import { promptForConnection } from './connections/connection'
import promptForHostname from './connections/hostname'
import { promptForGroup } from './connections/group'
import { promptForImportFile } from './connections/import'
import { promptForExportFile } from './connections/export'
import { promptForConnectionSettings } from './connections/settings'
import { credentialDetailsPrompt, credentialPrompt, editCredentialDetailsPrompt } from './credentials/credential'

export const Prompts = {
    connection: {
        select: promptForConnection,
        hostname: promptForHostname,
        group: promptForGroup,
        importFile: promptForImportFile,
        exportFile: promptForExportFile,
        settings: promptForConnectionSettings
    },
    credential: {
        select: credentialPrompt,
        details: credentialDetailsPrompt,
        editDetails: editCredentialDetailsPrompt,
    }
}