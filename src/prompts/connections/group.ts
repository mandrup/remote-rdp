import * as vscode from 'vscode'
import { Storage } from '../../storage'

export type GroupPromptResult = { cancelled: true } | { cancelled: false; value: string | undefined }

export async function promptForGroup(
    context: vscode.ExtensionContext,
    current?: string
): Promise<GroupPromptResult> {
    const connections = Storage.connection.getAll(context)
    const groups = Array.from(
        new Set(connections.map(connection => connection.group?.trim()).filter((g): g is string => !!g))
    )

    if (groups.length === 0) {
        return promptNewGroupInput(current)
    }

    const items: vscode.QuickPickItem[] = [
        ...groups.map(g => ({
            label: g,
            description: g === current ? '(current)' : undefined,
        })),
        {
            label: 'No group',
            description: current === undefined ? '(current)' : undefined,
        },
        {
            label: 'Create new group',
            alwaysShow: true,
        }
    ]

    const selected = await vscode.window.showQuickPick(items, {
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
        return { cancelled: newGroup === undefined, value: newGroup || undefined }
    }

    return { cancelled: false, value: selected.label === 'No group' ? undefined : selected.label }
}

async function promptNewGroupInput(current?: string): Promise<GroupPromptResult> {
    const inputGroup = await vscode.window.showInputBox({
        prompt: 'Enter group name (optional)',
        value: current,
        placeHolder: 'Leave empty for no group',
    })
    return { cancelled: inputGroup === undefined, value: inputGroup || undefined }
}