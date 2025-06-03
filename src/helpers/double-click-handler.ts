type ClickCallback<T> = (item: T) => Promise<void>

export function createDoubleClickHandler<T extends { id?: string }>(
    onDoubleClick: ClickCallback<T>,
    delay = 300
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
