import * as vscode from 'vscode'
import BaseProvider from '../base-provider'
import { Storage } from '../../storage'
import { COMMAND_IDS } from '../../constants'
import { CredentialTreeItem, CredentialItem, EmptyItem } from './items'
import { CredentialModel } from '../../models/credential'
import { 
    createCredentialTreeItem, 
    createEmptyTreeItem,
    sortCredentialsByUsername,
    handleProviderError
} from '../shared'

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
            const credentials = await Storage.credential.getAll(this.context)
            if (credentials.length === 0) {
                return [this.createEmptyItem()]
            }
            return sortCredentialsByUsername(credentials)
                .map(c => this.createCredentialTreeItem(c))
        } catch (error) {
            return handleProviderError('get credentials', error, 'Failed to load credentials.')
        }
    }

    private createCredentialTreeItem(credential: CredentialModel): CredentialItem {
        const item = createCredentialTreeItem(credential) as CredentialItem
        item.type = 'credential'
        item.credential = credential
        return item
    }

    private createEmptyItem(): EmptyItem {
        const item = createEmptyTreeItem(
            'No credentials saved',
            'emptyCredentials'
        ) as EmptyItem
        item.type = 'empty'
        return item
    }
}