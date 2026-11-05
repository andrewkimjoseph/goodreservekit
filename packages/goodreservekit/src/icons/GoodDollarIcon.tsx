import { useId, type SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/** GoodDollar mark from the CNV website token artwork. */
export function GoodDollarIcon({ size = 42, ...props }: IconProps) {
  const uid = useId().replace(/:/g, "");
  const clip = `${uid}-clip`;
  const frame = `${uid}-frame`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="110 110 780 780"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <clipPath id={clip}>
          <path d="M0,407.826H735.844V-328H0Z" transform="translate(0 328)" />
        </clipPath>
        <clipPath id={frame}>
          <rect width="1000" height="1000" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${frame})`}>
        <circle cx="500" cy="500" r="370" fill="#ffffff" />
        <g transform="translate(132.114 132.087)">
          <g clipPath={`url(#${clip})`}>
            <path
              d="M407.836,203.914C407.836.719,243.112-164,39.907-164-163.268-164-328.008.719-328.008,203.914s164.74,367.911,367.915,367.911c203.2,0,367.929-164.72,367.929-367.911M223.494,29.631l-74.509,74.511c0-.011-.02-.011-.02-.027l-19.378,19.374A120.335,120.335,0,1,0,44.493,328.917a120.542,120.542,0,0,0,117.3-93.454H17.606L71.362,181.7H216.494a174.549,174.549,0,0,1,2.084,26.873c0,96.005-78.094,174.1-174.086,174.1A173.522,173.522,0,0,1-78.518,331.648l-25.343,25.341h-76.077l69.361-69.313a173.125,173.125,0,0,1-19.019-79.1c0-95.989,78.1-174.086,174.09-174.086a173.246,173.246,0,0,1,79.162,18.954l23.813-23.811Z"
              transform="translate(328.008 164.001)"
              fill="#18aefa"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}
