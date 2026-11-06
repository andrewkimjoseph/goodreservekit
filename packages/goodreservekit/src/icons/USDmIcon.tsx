import { useId, type HTMLAttributes } from "react";
import { usdmSvg } from "./usdmMarkup.js";

type IconProps = HTMLAttributes<HTMLSpanElement> & { size?: number };

/** USDm mark from the CNV website token artwork. */
export function USDmIcon({ size = 42, ...props }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const markup = usdmSvg.replaceAll("__GRK__", `${uid}-`);

  return (
    <span
      {...props}
      aria-hidden="true"
      style={{ width: size, height: size, ...props.style }}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
