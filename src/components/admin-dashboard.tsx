'use client';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Settings, Users, ShoppingCart, FileText, Menu, PlusCircle, ListOrdered } from 'lucide-react';
import AdminUsers from '@/components/admin-users';
import AdminAddProduct from '@/components/admin-add-product';
import AdminLegalPages from '@/components/admin-legal-pages';
import AdminMenuItems from '@/components/admin-menu-items';
import AdminManageProducts from '@/components/admin-manage-products';
import AdminOrders from '@/components/admin-orders';
import AdminSettings from '@/components/admin-settings';

type AdminSection = 'users' | 'addProduct' | 'manageProducts' | 'orders' | 'legal' | 'menu' | 'settings';

export default function AdminDashboard() {
  const { isMobile, setOpenMobile } = useSidebar();
  const [activeSection, setActiveSection] = useState<AdminSection>('orders');

  const handleSectionClick = (section: AdminSection) => {
    setActiveSection(section);
    if(isMobile) {
      setOpenMobile(false);
    }
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <AdminUsers />;
      case 'addProduct':
        return <AdminAddProduct />;
      case 'manageProducts':
        return <AdminManageProducts />;
      case 'orders':
        return <AdminOrders />;
      case 'legal':
        return <AdminLegalPages />;
      case 'menu':
        return <AdminMenuItems />;
       case 'settings':
        return <AdminSettings />;
      default:
        return <AdminOrders />;
    }
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'users': return 'Users';
      case 'addProduct': return 'Add Product';
      case 'manageProducts': return 'Manage Products';
      case 'orders': return 'Orders';
      case 'legal': return 'Legal Pages';
      case 'menu': return 'Menu Items';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10.5rem)]">
      <Sidebar>
        <SidebarHeader className="hidden">
            <SidebarTrigger />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleSectionClick('orders')} isActive={activeSection === 'orders'}>
                <ListOrdered />
                <span>Orders</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleSectionClick('users')} isActive={activeSection === 'users'}>
                <Users />
                <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSectionClick('addProduct')} isActive={activeSection === 'addProduct'}>
                    <PlusCircle />
                    <span>Add Product</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => handleSectionClick('manageProducts')} isActive={activeSection === 'manageProducts'}>
                    <ShoppingCart />
                    <span>Manage Products</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleSectionClick('legal')} isActive={activeSection === 'legal'}>
                <FileText />
                <span>Legal Pages</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleSectionClick('menu')} isActive={activeSection === 'menu'}>
                <Menu />
                <span>Menu Items</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleSectionClick('settings')} isActive={activeSection === 'settings'}>
                <Settings />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1 p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
            <h1 className="font-headline text-3xl font-extrabold tracking-tighter capitalize">
                {getSectionTitle()}
            </h1>
        </div>
        {renderSection()}
      </main>
    </div>
  );
}
