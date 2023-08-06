import carret from "./carret.svg";

type CarretProps = preact.JSX.IntrinsicElements["svg"] & { $type?: keyof typeof TRANSFORM };

const TRANSFORM = {
    left: undefined,
    right: "rotate(180)",
};

export function Carret(
    { xmlns = "http://www.w3.org/2000/svg", viewBox = carret.viewBox, fill = "currentColor", $type = "right", ...rest }:
        CarretProps,
) {
    return (
        <svg xmlns={xmlns} viewBox={viewBox} fill={fill} {...rest}>
            <use transform={TRANSFORM[$type]} transform-origin="50% 50%" href={carret.href} />
        </svg>
    );
}
