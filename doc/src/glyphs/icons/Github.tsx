import github from "./github.svg";

export function Github(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = github.viewBox, fill = "currentColor", ...rest }:
        preact.JSX.IntrinsicElements["svg"],
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use href={github.href} />
        </svg>
    );
}
