import * as vscode from 'vscode'
import { CredentialModel } from '../../models/credential'

export interface BaseTreeItem extends vscode.TreeItem {
    type: 'credential' | 'empty'
}

export interface CredentialItem extends BaseTreeItem {
    type: 'credential'
    credential: CredentialModel
}

export interface EmptyItem extends BaseTreeItem {
    type: 'empty'
}

export type CredentialTreeItem = CredentialItem | EmptyItem 