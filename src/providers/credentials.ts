import * as vscode from 'vscode'
import { BaseProvider } from './base-provider'
import { readCredentials } from '../storage'
import { CredentialModel } from '../models/credential'
import { COMMAND_IDS } from '../constants'

interface CredentialItem extends vscode.TreeItem {
    type: 'credential'
    credential: CredentialModel
}

export class CredentialsProvider extends BaseProvider<CredentialItem> {
    constructor(private readonly context: vscode.ExtensionContext) {
        super()

        context.subscriptions.push(
            vscode.commands.registerCommand(COMMAND_IDS.credential.refresh, () => this.refresh())
        )

        this.refresh()
    }

    getTreeItem(element: CredentialItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: CredentialItem): Promise<CredentialItem[]> {
        if (element) return []

        try {
            const credentials = await readCredentials(this.context)
            return credentials.length
                ? credentials.map(c => this.createCredentialItem(c))
                : [this.createEmptyItem()]
        } catch (error) {
            console.error('Failed to get credentials:', error)
            vscode.window.showErrorMessage('Failed to load credentials.')
            return []
        }
    }

    private createCredentialItem(credential: CredentialModel): CredentialItem {
        const item = new vscode.TreeItem(credential.username, vscode.TreeItemCollapsibleState.None) as CredentialItem
        item.id = credential.id
        item.type = 'credential'
        item.credential = credential
        item.tooltip = credential.username
        item.contextValue = 'credentialItem'
        item.iconPath = new vscode.ThemeIcon('key')
        return item
    }

    private createEmptyItem(): CredentialItem {
        const item = new vscode.TreeItem('No credentials saved', vscode.TreeItemCollapsibleState.None) as CredentialItem
        item.id = 'empty'
        item.type = 'credential'
        item.contextValue = 'emptyCredentials'
        item.iconPath = new vscode.ThemeIcon('info')
        item.tooltip = 'No credentials available'
        return item
    }
}
