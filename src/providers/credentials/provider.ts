import * as vscode from 'vscode'
import BaseProvider from '../base-provider'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { CredentialTreeItem, CredentialItem, EmptyItem } from './items'
import { CredentialModel } from '../../models/credential'

export class CredentialsProvider extends BaseProvider<CredentialTreeItem> {
    constructor(private readonly context: vscode.ExtensionContext) {
        super()

        if (!process.env.VSCODE_TEST) {
            context.subscriptions.push(
                vscode.commands.registerCommand(COMMAND_IDS.credential.refresh, () => this.refresh())
            )
            this.refresh()
        }
    }

    getTreeItem(element: CredentialTreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(element?: CredentialTreeItem): Promise<CredentialTreeItem[]> {
        if (element) {
            return []
        }

        try {
            const credentials = await Storage.credential.readAll(this.context)
            return credentials.length
                ? credentials
                    .sort((a, b) => a.username.localeCompare(b.username))
                    .map(c => this.createCredentialItem(c))
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
        item.contextValue = 'credentialItem'
        item.iconPath = new vscode.ThemeIcon('key')
        return item
    }

    private createEmptyItem(): EmptyItem {
        const item = new vscode.TreeItem('No credentials saved', vscode.TreeItemCollapsibleState.None) as EmptyItem
        item.id = 'empty'
        item.type = 'empty'
        item.contextValue = 'emptyCredentials'
        item.iconPath = new vscode.ThemeIcon('info')
        return item
    }
} 