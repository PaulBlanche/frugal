import check from "./check.svg";

export function Check(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = check.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={check.href} />
        </svg>
    );
}
