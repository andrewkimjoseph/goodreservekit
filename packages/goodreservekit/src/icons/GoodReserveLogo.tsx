import type { ImgHTMLAttributes } from "react";
import logo from "./goodreserve.png";

type LogoProps = ImgHTMLAttributes<HTMLImageElement> & { height?: number };

/** GoodReserve wordmark. The PNG is inlined into the package bundle. */
export function GoodReserveLogo({ height = 22, alt = "GoodReserve", ...props }: LogoProps) {
  return (
    <img
      {...props}
      src={logo}
      alt={alt}
      height={height}
      style={{ display: "block", width: "auto", height, ...props.style }}
    />
  );
}
