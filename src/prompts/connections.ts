import * as vscode from 'vscode'
import { readConnections } from '../storage'
import type { ConnectionModel } from '../models/connection'

export type GroupPromptResult = { cancelled: true } | { cancelled: false; value: string | undefined }

export async function promptHostname(current?: string): Promise<string | undefined> {
    const hostname = await vscode.window.showInputBox({
        prompt: current ? 'Edit hostname' : 'Enter hostname',
        value: current,
        placeHolder: 'Enter hostname',
    })

    if (!hostname) {
        return undefined
    }

    return hostname
}

export async function promptGroup(
    context: vscode.ExtensionContext,
    current?: string
): Promise<GroupPromptResult> {
    const connections = readConnections(context)
    const groups = Array.from(
        new Set(connections.map(c => c.group?.trim()).filter((g): g is string => !!g))
    )

    if (groups.length === 0) {
        return promptNewGroupInput(current)
    }

    const sortedGroups = sortGroups(groups, current)
    const items = buildGroupOptions(sortedGroups, current)

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select an existing group, create new, or leave blank',
    })

    if (!selected) {
        return { cancelled: true }
    }

    if (selected.pickedValue === '__CREATE__') {
        const newGroup = await vscode.window.showInputBox({
            prompt: 'Enter new group name',
            placeHolder: 'Leave empty for no group',
        })
        return { cancelled: newGroup === undefined, value: newGroup || undefined }
    }

    return { cancelled: false, value: selected.pickedValue }
}

function sortGroups(groups: string[], current?: string): string[] {
    return current && groups.includes(current)
        ? [current, ...groups.filter(g => g !== current)]
        : groups
}

function buildGroupOptions(
    sortedGroups: string[],
    current?: string
): Array<vscode.QuickPickItem & { pickedValue: string | undefined }> {
    return [
        ...sortedGroups.map(g => ({
            label: g,
            description: g === current ? '(current)' : undefined,
            pickedValue: g,
        })),
        {
            label: 'No group',
            description: current === undefined ? '(current)' : undefined,
            pickedValue: undefined,
        },
        {
            label: 'Create new group',
            alwaysShow: true,
            description: '',
            pickedValue: '__CREATE__',
        }
    ]
}

async function promptNewGroupInput(current?: string): Promise<GroupPromptResult> {
    const value = await vscode.window.showInputBox({
        prompt: 'Enter group name (optional)',
        value: current,
        placeHolder: 'Leave empty for no group',
    })

    return value === undefined
        ? { cancelled: true }
        : { cancelled: false, value: value || undefined }
}

export async function promptConnection(
    context: vscode.ExtensionContext,
    item?: vscode.TreeItem
): Promise<ConnectionModel | undefined> {
    const connections = readConnections(context)

    if (item?.id && typeof item.id === 'string') {
        return connections.find(c => c.id === item.id)
    }

    if (connections.length === 0) {
        vscode.window.showWarningMessage('No connections available.')
        return undefined
    }

    const selected = await vscode.window.showQuickPick(
        connections.map(conn => ({
            label: conn.hostname,
            description: conn.group ? `Group: ${conn.group}` : undefined,
            detail: conn.credentialUsername
                ? `Username: ${conn.credentialUsername}`
                : 'No credential',
            id: conn.id,
        })),
        { placeHolder: 'Select a connection' }
    )

    return selected ? connections.find(c => c.id === selected.id) : undefined
}

export async function promptOpenFile(
    filters?: { [name: string]: string[] }
): Promise<vscode.Uri | undefined> {
    const uris = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectFolders: false,
        canSelectMany: false,
        filters
    })
    return uris?.[0]
}

export async function promptSaveFile(
    defaultUri?: vscode.Uri,
    filters?: { [name: string]: string[] }
): Promise<vscode.Uri | undefined> {
    return vscode.window.showSaveDialog({
        filters,
        defaultUri
    })
}