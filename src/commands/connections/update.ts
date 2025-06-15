import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { ConnectionGroupItem, ConnectionTreeItem } from '../../providers'
import { updateConnectionById, updateGroupCredentials } from '../../storage/shared'
import { handleCommandError, refreshViews, validatePromptResult, isGroupPromptCancelled, getGroupValue } from '../shared'
import { promptForConnectionSettings } from '../../prompts/connections/settings'
import { validateConnectionSettings, sanitizeConnectionSettings } from '../../models/connection'

export async function updateConnectionCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const connection = await Prompts.connection.select(context, item)
        if (!validatePromptResult(connection)) {
            return
        }

        const hostname = await Prompts.connection.hostname(connection.hostname)
        if (!validatePromptResult(hostname)) {
            return
        }

        const groupResult = await Prompts.connection.group(context, connection.group)
        if (isGroupPromptCancelled(groupResult)) {
            return
        }

        const credentialId = await Prompts.credential.select(context, connection.credentialId)
        if (credentialId === undefined) {
            return
        }

        const connections = Storage.connection.getAll(context)
        const updatedConnections = updateConnectionById(connections, connection.id, {
            hostname,
            credentialId,
            group: getGroupValue(groupResult)
        })

        await Storage.connection.updateAll(context, updatedConnections)
        await refreshViews()
    } catch (error) {
        await handleCommandError('update connection', error)
    }
}

export async function updateGroupCredentialsCommand(context: vscode.ExtensionContext, item?: ConnectionTreeItem): Promise<void> {
    try {
        if (!item || item.type !== 'group') {
            vscode.window.showErrorMessage('This command can only be used on connection groups.')
            return
        }

        const groupItem = item as ConnectionGroupItem
        const credentialId = await Prompts.credential.select(context, undefined)
        if (!validatePromptResult(credentialId)) {
            return
        }

        const connections = Storage.connection.getAll(context)
        const updatedConnections = updateGroupCredentials(connections, groupItem.group, credentialId)

        await Storage.connection.updateAll(context, updatedConnections)
        await refreshViews()
    } catch (error) {
        await handleCommandError('update group credentials', error)
    }
}

export async function configureConnectionSettingsCommand(context: vscode.ExtensionContext, item?: vscode.TreeItem): Promise<void> {
    try {
        const connection = await Prompts.connection.select(context, item)
        if (!validatePromptResult(connection)) {
            return
        }

        const updatedSettings = await promptForConnectionSettings(connection.connectionSettings)
        if (!updatedSettings) {
            return
        }

        // Validate the settings
        const validation = validateConnectionSettings(updatedSettings)
        if (!validation.isValid) {
            const errorMessage = `Invalid connection settings:\n${validation.errors.join('\n')}`
            const choice = await vscode.window.showWarningMessage(
                errorMessage + '\n\nWould you like to automatically fix these issues?',
                'Fix Automatically', 
                'Cancel'
            )
            
            if (choice !== 'Fix Automatically') {
                return
            }
        }

        // Sanitize the settings to ensure they're within valid ranges
        const sanitizedSettings = sanitizeConnectionSettings(updatedSettings)

        const connections = Storage.connection.getAll(context)
        const updatedConnections = updateConnectionById(connections, connection.id, {
            ...connection,
            connectionSettings: sanitizedSettings,
            modifiedAt: new Date().toISOString()
        })

        await Storage.connection.updateAll(context, updatedConnections)
        await refreshViews()

        const message = validation.isValid 
            ? `Connection settings updated for ${connection.hostname}`
            : `Connection settings updated and fixed for ${connection.hostname}`
        vscode.window.showInformationMessage(message)
    } catch (error) {
        await handleCommandError('configure connection settings', error)
    }
}