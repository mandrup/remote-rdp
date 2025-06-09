import * as vscode from 'vscode'
import type { ConnectionModel } from '../models/connection'
import type { CredentialModel } from '../models/credential'
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

export function formatRelativeTime(date: Date | string): string {
    const now = new Date()
    const targetDate = typeof date === 'string' ? new Date(date) : date
    const diffMs = now.getTime() - targetDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

    if (diffDays === 0) { return 'today' }
    if (diffDays === 1) { return 'yesterday' }
    if (diffDays < 7) { return rtf.format(-diffDays, 'day') }
    if (diffDays < 30) { return rtf.format(-Math.floor(diffDays / 7), 'week') }
    if (diffDays < 365) { return rtf.format(-Math.floor(diffDays / 30), 'month') }
    return rtf.format(-Math.floor(diffDays / 365), 'year')
}

export function formatConnectionTooltip(
    connection: ConnectionModel,
    credentialUsername: string
): string {
    const group = connection.group?.trim() || 'Ungrouped'
    const credential = credentialUsername === 'No credential assigned' ? 'None' : credentialUsername

    return [
        `Group: ${group}`,
        `Host: ${connection.hostname}`,
        `Credential: ${credential}`
    ].join('\n')
}

export function formatCredentialTooltip(credential: CredentialModel): string {
    const createdAt = credential.createdAt
        ? formatRelativeTime(credential.createdAt)
        : 'N/A'

    const modifiedAt = credential.modifiedAt
        ? formatRelativeTime(credential.modifiedAt)
        : 'N/A'

    return [
        `Username: ${credential.username}`,
        `Created: ${createdAt}`,
        `Modified: ${modifiedAt}`
    ].join('\n')
}

export function sortConnectionsByGroup(connections: ConnectionModel[]): ConnectionModel[] {
    return connections.sort((a, b) => {
        const groupA = a.group?.trim() || ''
        const groupB = b.group?.trim() || ''

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
