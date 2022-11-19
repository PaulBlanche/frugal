import * as hooks from 'preact/hooks';

export function usClientSide() {
    const [isClientSide, setIsClientSide] = hooks.useState(false);

    hooks.useEffect(() => {
        setIsClientSide(true);
    }, []);

    return isClientSide;
}
