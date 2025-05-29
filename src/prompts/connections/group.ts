import * as vscode from 'vscode'
import { Storage } from '../../storage'

export type GroupPromptResult = { cancelled: true } | { cancelled: false; value: string | undefined }

export default async function groupPrompt(
    context: vscode.ExtensionContext,
    current?: string
): Promise<GroupPromptResult> {
    const connections = Storage.connection.readAll(context)
    const groups = Array.from(
        new Set(connections.map(connection => connection.group?.trim()).filter((g): g is string => !!g))
    )

    if (groups.length === 0) {
        return promptNewGroupInput(current)
    }

    const sortedGroups = current && groups.includes(current) ? [current, ...groups.filter(g => g !== current)] : groups
    const items = [
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

async function promptNewGroupInput(current?: string): Promise<GroupPromptResult> {
    const value = await vscode.window.showInputBox({
        prompt: 'Enter group name (optional)',
        value: current,
        placeHolder: 'Leave empty for no group',
    })

    return value === undefined ? { cancelled: true } : { cancelled: false, value: value || undefined }
}