import clipboard from "./clipboard.svg";

export function Clipboard(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = clipboard.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={clipboard.href} />
        </svg>
    );
}
