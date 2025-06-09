import * as vscode from 'vscode'
import { COMMAND_IDS, ERROR_MESSAGES, UI_CONSTANTS } from '../constants'
import { ErrorFactory, getUserErrorMessage, logError, isRemoteRdpError } from '../errors'

export async function refreshViews(): Promise<void> {
    await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
}

export async function refreshConnections(): Promise<void> {
    await vscode.commands.executeCommand(COMMAND_IDS.connection.refresh)
}

export async function refreshCredentials(): Promise<void> {
    await vscode.commands.executeCommand(COMMAND_IDS.credential.refresh)
}

export function isPromptCancelled<T>(result: T | undefined): result is undefined {
    return result === undefined
}

export function validatePromptResult<T>(result: T | undefined): result is T {
    return result !== undefined
}

export function isGroupPromptCancelled(result: { cancelled: true } | { cancelled: false; value: string | undefined }): result is { cancelled: true } {
    return result.cancelled
}

export function getGroupValue(result: { cancelled: false; value: string | undefined }): string | undefined {
    return result.value || undefined
}

export function hasItems<T>(items: T[]): boolean {
    return items.length > 0
}

export async function handleCommandError(operation: string, error: unknown): Promise<void> {
    logError(error, `command:${operation}`)
    
    const baseMessage = isRemoteRdpError(error) ? getUserErrorMessage(error) : 
                       (error instanceof Error ? error.message : String(error))
    
    const userMessage = `Failed to ${operation}: ${baseMessage}`
    await vscode.window.showErrorMessage(userMessage)
}

export function validatePlatformSupport(): boolean {
    if (process.platform !== 'win32') {
        const error = ErrorFactory.platform.notSupported()
        vscode.window.showErrorMessage(error.getUserMessage())
        return false
    }
    return true
}

export function validateConnectionCredentials(connection: { credentialId?: string }): boolean {
    if (!connection.credentialId) {
        const error = ErrorFactory.connection.noCredentials()
        vscode.window.showErrorMessage(error.getUserMessage())
        return false
    }
    return true
}

export function showCredentialNotFoundError(credentialId: string): void {
    const error = ErrorFactory.connection.credentialNotFound(credentialId)
    vscode.window.showErrorMessage(error.getUserMessage())
}

export function showGroupCommandOnlyError(): void {
    vscode.window.showErrorMessage(ERROR_MESSAGES.GROUP_COMMAND_ONLY)
}

export function showInvalidJsonError(): void {
    vscode.window.showErrorMessage(ERROR_MESSAGES.INVALID_JSON_FILE)
}

type ClickCallback<T> = (item: T) => Promise<void>

export function createDoubleClickHandler<T extends { id?: string }>(
    onDoubleClick: ClickCallback<T>,
    delay = UI_CONSTANTS.DOUBLE_CLICK_DELAY
): (item: T) => void {
    let lastClickTime = 0
    let lastClickedId: string | undefined = undefined

    return (item: T) => {
        const now = Date.now()
        const id = item.id

        if (!id) {
            return
        }

        if (lastClickedId === id && (now - lastClickTime) < delay) {
            lastClickTime = 0
            lastClickedId = undefined
            void onDoubleClick(item)
        } else {
            lastClickedId = id
            lastClickTime = now
            setTimeout(() => {
                if (Date.now() - lastClickTime >= delay) {
                    lastClickTime = 0
                    lastClickedId = undefined
                }
            }, delay)
        }
    }
}
