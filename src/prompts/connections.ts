import * as vscode from 'vscode'
import { readConnections } from '../storage/connections'
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
    const existingGroups = Array.from(
        new Set(connections.map(c => c.group?.trim()).filter(Boolean))
    )

    if (existingGroups.length > 0) {
        const groupOptions = [
            { label: '', description: 'No group' }, // Blank option, results in undefined
            ...existingGroups.map(g => ({ label: g! })),
            { label: 'Create new group', alwaysShow: true },
        ]

        const selected = await vscode.window.showQuickPick(groupOptions, {
            placeHolder: 'Select an existing group, create new, or leave blank',
        })


        if (!selected) { 
            return { cancelled: true } 
        }

        if (selected.label === 'Create new group') {
            const newGroup = await vscode.window.showInputBox({
                prompt: 'Enter new group name',
                placeHolder: 'Leave empty for no group',
            })
            if (newGroup === undefined) { return { cancelled: true } }
            return { cancelled: false, value: newGroup || undefined }
        }

        return { cancelled: false, value: selected.label }
    }

    const inputGroup = await vscode.window.showInputBox({
        prompt: 'Enter group name (optional)',
        value: current,
        placeHolder: 'Leave empty for no group',
    })

    if (inputGroup === undefined) { 
        return { cancelled: true } 
    }
    return { cancelled: false, value: inputGroup || undefined }
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