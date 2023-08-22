type Fragment<PROPS> = {
    render(props: PROPS): Promise<string> | string;
};

type RenderableFragment = () => Promise<string> | string;

export function render<PROPS>(fragment: Fragment<PROPS>, props: PROPS): RenderableFragment {
    return () => fragment.render(props);
}

/*export function stream(
    templateArray: TemplateStringsArray,
    ...interpolations: (RenderableFragment | string)[]
): ReadableStream<string> {
    let i = 0;
    let promise: Promise<void>;
    return new ReadableStream({
        async pull(controller) {
            if (promise !== undefined) {
                await promise;
            }
            const chunkOrFragment = i % 2 === 0 ? templateArray[i / 2] : interpolations[(i - 1) / 2];
            i++;

            if (chunkOrFragment === undefined) {
                controller.close();
                return;
            }

            promise = Promise.resolve(chunkOrFragment).then((chunkOrFragment) => {
                if (typeof chunkOrFragment === "string") {
                    controller.enqueue(chunkOrFragment);
                } else {
                    return Promise.resolve(chunkOrFragment()).then((chunk) => {
                        controller.enqueue(chunk);
                    });
                }
            });
        },
    });
}*/
