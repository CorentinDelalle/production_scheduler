import type { ImgHTMLAttributes } from 'react';

/** The app logo, on a transparent background. */
export default function AppLogoIcon(
    props: ImgHTMLAttributes<HTMLImageElement>,
) {
    return (
        <img
            src="/images/logo.png"
            alt="Production Scheduler"
            width={109}
            height={137}
            {...props}
        />
    );
}
