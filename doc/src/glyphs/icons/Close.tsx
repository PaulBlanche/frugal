import close from "./close.svg";

export function Close(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = close.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={close.href} />
        </svg>
    );
}
