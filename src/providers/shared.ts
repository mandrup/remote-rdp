import * as vscode from 'vscode'
import type { ConnectionModel } from '../models/connection'
import type { CredentialModel } from '../models/credential'
import { UI_CONSTANTS } from '../constants'
import { logError, getUserErrorMessage, isRemoteRdpError } from '../errors'

export function createBaseTreeItem(
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
): vscode.TreeItem {
    return new vscode.TreeItem(label, collapsibleState)
}

export function createEmptyTreeItem(
    label: string,
    contextValue: string,
    iconId: string = 'info'
): vscode.TreeItem {
    const item = createBaseTreeItem(label)
    item.id = 'empty'
    item.contextValue = contextValue
    item.iconPath = new vscode.ThemeIcon(iconId)
    return item
}

export function createConnectionTreeItem(
    connection: ConnectionModel,
    credentialUsername: string = 'No credential assigned'
): vscode.TreeItem {
    const item = createBaseTreeItem(connection.hostname)
    item.id = connection.id
    item.contextValue = 'connectionItem'
    item.iconPath = new vscode.ThemeIcon('remote')
    item.description = credentialUsername
    item.tooltip = formatConnectionTooltip(connection, credentialUsername)
    item.command = {
        command: 'remote-rdp:connection:connect',
        title: 'Connect',
        arguments: [connection]
    }
    return item
}

export function createCredentialTreeItem(credential: CredentialModel): vscode.TreeItem {
    const item = createBaseTreeItem(credential.username)
    item.id = credential.id
    item.contextValue = 'credentialItem'
    item.iconPath = new vscode.ThemeIcon('key')
    item.tooltip = formatCredentialTooltip(credential)
    return item
}

export function createGroupTreeItem(
    group: string,
    connections: ConnectionModel[]
): vscode.TreeItem {
    const item = createBaseTreeItem(group, vscode.TreeItemCollapsibleState.Expanded)
    item.contextValue = 'connectionGroup'
    item.iconPath = new vscode.ThemeIcon('folder')
    item.tooltip = `${connections.length} connection(s)`
    return item
}

export function formatConnectionTooltip(
    connection: ConnectionModel,
    credentialUsername: string
): string {
    return [
        `Hostname: ${connection.hostname}`,
        `Group: ${connection.group?.trim() || 'None'}`,
        `Credential: ${credentialUsername}`,
        `Created at: ${connection.createdAt || 'N/A'}`,
        `Modified at: ${connection.modifiedAt || 'N/A'}`
    ].join('\n')
}

export function formatCredentialTooltip(credential: CredentialModel): string {
    const createdAt = credential.createdAt
        ? new Date(credential.createdAt).toLocaleString()
        : 'N/A'
    
    const modifiedAt = credential.modifiedAt
        ? new Date(credential.modifiedAt).toLocaleString()
        : 'N/A'

    return [
        `Username: ${credential.username}`,
        `Password: ${UI_CONSTANTS.PASSWORD_MASK_CHAR.repeat(UI_CONSTANTS.PASSWORD_MASK_LENGTH)}`,
        `Created at: ${createdAt}`,
        `Modified at: ${modifiedAt}`
    ].join('\n')
}

export function sortConnectionsByGroup(connections: ConnectionModel[]): ConnectionModel[] {
    return connections.sort((a, b) => {
        const groupA = a.group?.trim() || ''
        const groupB = b.group?.trim() || ''
        
        // Sort ungrouped connections first (empty string sorts before other strings)
        if (groupA !== groupB) {
            return groupA.localeCompare(groupB)
        }
        return a.hostname.localeCompare(b.hostname)
    })
}

export function groupConnectionsByGroup(connections: ConnectionModel[]): Map<string, ConnectionModel[]> {
    const groups = new Map<string, ConnectionModel[]>()
    connections.forEach(connection => {
        const group = connection.group?.trim() || null
        const groupKey = group || 'Ungrouped'
        if (!groups.has(groupKey)) {
            groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(connection)
    })
    return groups
}

export function handleProviderError(operation: string, error: unknown, userMessage: string): never[] {
    logError(error, `provider-${operation}`)
    
    const message = isRemoteRdpError(error) ? getUserErrorMessage(error) : userMessage
    vscode.window.showErrorMessage(message)
    
    return []
}

export function handleDragDropError(operation: string, error: unknown, userMessage: string): void {
    logError(error, `drag-drop-${operation}`)
    
    const message = isRemoteRdpError(error) ? getUserErrorMessage(error) : userMessage
    vscode.window.showErrorMessage(message)
}

export function sortConnectionsByHostname(connections: ConnectionModel[]): ConnectionModel[] {
    return [...connections].sort((a, b) => a.hostname.localeCompare(b.hostname))
}

export function sortCredentialsByUsername(credentials: CredentialModel[]): CredentialModel[] {
    return [...credentials].sort((a, b) => a.username.localeCompare(b.username))
}
