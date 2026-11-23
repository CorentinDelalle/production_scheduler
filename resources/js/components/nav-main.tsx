import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

type Props = {
    items: NavItem[];
    label?: string;
};

export function NavMain({ items, label }: Props) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            {label && (
                <SidebarGroupLabel className="text-sidebar-muted">
                    {label}
                </SidebarGroupLabel>
            )}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuButtonItem
                        key={item.title}
                        item={item}
                        active={isCurrentOrParentUrl(item.href)}
                    />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SidebarMenuButtonItem({
    item,
    active,
}: {
    item: NavItem;
    active: boolean;
}) {
    return (
        <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                isActive={active}
                tooltip={{ children: item.title }}
                className="data-[active=true]:bg-sidebar-accent data-[active=true]:text-white"
            >
                <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}
