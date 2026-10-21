import { createElement } from "react";
export const DefaultLinkV1 = ({ href, children, ...props }) => createElement("a", { href, ...props }, children);
export const DefaultImageV1 = ({ priority: _priority, sizes, ...props }) => createElement("img", { ...props, sizes });
export const DefaultVideoV1 = ({ src, poster, className }) => createElement("video", {
    src, poster, className, muted: true, loop: true, playsInline: true, preload: "metadata", "aria-hidden": true, tabIndex: -1, disablePictureInPicture: true,
});
export const DEFAULT_PRIMITIVES_V1 = {
    Link: DefaultLinkV1,
    Image: DefaultImageV1,
    Video: DefaultVideoV1,
};
export function primitivesV1(value) {
    return { ...DEFAULT_PRIMITIVES_V1, ...value };
}
