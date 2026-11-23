import type { ImgHTMLAttributes } from 'react';

/** The Hart Print logo (heart, "HART", "Print"), on a transparent background. */
export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src="/images/logo-hartprint.png"
            alt="Hart Print"
            width={109}
            height={137}
            {...props}
        />
    );
}
