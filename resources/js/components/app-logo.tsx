import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <AppLogoIcon className="h-10 w-auto shrink-0 group-data-[collapsible=icon]:h-8" />
            <span className="truncate text-xs leading-tight text-sidebar-muted group-data-[collapsible=icon]:hidden">
                {name}
            </span>
        </>
    );
}
