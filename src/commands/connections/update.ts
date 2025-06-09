import * as vscode from 'vscode'
import { Storage } from '../../storage'
import { Prompts } from '../../prompts'
import { ConnectionGroupItem, ConnectionTreeItem } from '../../providers'
import { updateConnectionById, updateGroupCredentials } from '../../storage/shared'
import { handleCommandError, refreshViews, refreshConnections, validatePromptResult, isGroupPromptCancelled, getGroupValue } from '../shared'

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
        await refreshConnections()
    } catch (error) {
        await handleCommandError('update group credentials', error)
    }
}