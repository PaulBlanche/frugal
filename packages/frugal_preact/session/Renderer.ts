import * as snapshot from './snapshot.ts';

export class Renderer {
    nextDocument: Document;

    constructor(document: Document) {
        this.nextDocument = document;
    }

    render() {
        this.renderHead();
        this.renderBody();
    }

    renderBody() {
        [...document.body.childNodes].forEach((node) => {
            document.body.removeChild(node);
        });
        [...this.nextDocument.body.childNodes].forEach((node) => {
            document.body.appendChild(node);
        });
    }

    renderHead() {
        const headSnapshot = this.mergeHead(this.nextDocument.head);

        const alreadyMergedElements: Element[] = [];

        [...document.head.childNodes].forEach((element) => {
            if (element instanceof Element) {
                const elementIndex = headSnapshot.findIndex((node) =>
                    node.element === element
                );
                if (elementIndex === -1) {
                    document.head.removeChild(element);
                } else {
                    const node = headSnapshot[elementIndex];
                    if (node.name === 'script' && node.content.length !== 0) {
                        document.head.removeChild(element);
                    } else {
                        alreadyMergedElements.push(element);
                    }
                }
            }
        });

        let i = 0;
        for (const node of headSnapshot) {
            if (node.element === alreadyMergedElements[i]) {
                i++;
                continue;
            }

            if (node.name === 'script') {
                if (node.content.length !== 0) {
                    window.eval(node.content);
                    document.head.appendChild(node.element);
                } else {
                    const script = document.createElement('script');
                    for (const { name, value } of node.attributes) {
                        script.setAttribute(name, value);
                    }
                    document.head.appendChild(script);
                }
            } else {
                document.head.appendChild(node.element);
            }
        }
    }

    mergeHead(head: HTMLHeadElement): snapshot.Head {
        const previousSnapshot = snapshot.serialize(document.head);
        const nextSnapshot = snapshot.serialize(head);

        const mergeSnapshot: snapshot.Head = [];

        const merged: Set<string> = new Set();
        for (const node of previousSnapshot) {
            if (node.name !== 'script' && node.name !== 'link') {
                continue;
            }
            if (node.name === 'script' && node.content.length !== 0) {
                continue;
            }

            if (merged.has(node.hash)) {
                continue;
            }

            mergeSnapshot.push(node);
            merged.add(node.hash);
        }

        for (const node of nextSnapshot) {
            if (merged.has(node.hash)) {
                continue;
            }

            mergeSnapshot.push(node);
            merged.add(node.hash);
        }

        return mergeSnapshot;
    }
}
