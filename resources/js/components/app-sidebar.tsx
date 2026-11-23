import { Link } from '@inertiajs/react';
import {
    CalendarRange,
    ClipboardList,
    Layers,
    Package,
    Printer,
    Users,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as customersIndex } from '@/routes/customers';
import { index as machinesIndex } from '@/routes/machines';
import { index as ordersIndex } from '@/routes/orders';
import { index as productTypesIndex } from '@/routes/product-types';
import { index as productsIndex } from '@/routes/products';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    { title: 'Plan', href: dashboard(), icon: CalendarRange },
    { title: 'Orders', href: ordersIndex(), icon: ClipboardList },
];

const catalogNavItems: NavItem[] = [
    { title: 'Customers', href: customersIndex(), icon: Users },
    { title: 'Product types', href: productTypesIndex(), icon: Layers },
    { title: 'Products', href: productsIndex(), icon: Package },
    { title: 'Machines', href: machinesIndex(), icon: Printer },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <NavMain label="Catalog" items={catalogNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
