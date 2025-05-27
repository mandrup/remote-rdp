import * as assert from 'assert'
import * as vscode from 'vscode'
import { createMockContext } from '../utils'
import BaseProvider from '../../providers/base-provider'

class TestProvider extends BaseProvider<vscode.TreeItem> {
    private items: vscode.TreeItem[] = []

    constructor() {
        super()
    }

    setItems(items: vscode.TreeItem[]) {
        this.items = items
        this.refresh()
    }

    getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
        return element
    }

    async getChildren(): Promise<vscode.TreeItem[]> {
        return this.items
    }
}

suite('Base Provider Test Suite', () => {
    let provider: TestProvider
    let context: vscode.ExtensionContext

    suiteSetup(() => {
        context = createMockContext()
    })

    setup(() => {
        provider = new TestProvider()
    })

    test('getChildren returns empty array by default', async () => {
        const children = await provider.getChildren()
        assert.strictEqual(children.length, 0)
    })

    test('refresh updates tree view', async () => {
        const item1 = new vscode.TreeItem('Item 1')
        const item2 = new vscode.TreeItem('Item 2')
        provider.setItems([item1, item2])

        const children = await provider.getChildren()
        assert.strictEqual(children.length, 2)
        assert.strictEqual(children[0].label, 'Item 1')
        assert.strictEqual(children[1].label, 'Item 2')
    })

    test('onDidChangeTreeData event is fired on refresh', async () => {
        const eventFired = new Promise<void>(resolve => {
            provider.onDidChangeTreeData(() => {
                resolve()
            })
        })

        provider.refresh()
        await eventFired
    })

    test('getTreeItem returns the element', () => {
        const item = new vscode.TreeItem('Test Item')
        const treeItem = provider.getTreeItem(item)
        assert.strictEqual(treeItem, item)
    })
})
