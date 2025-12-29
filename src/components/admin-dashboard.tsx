'use client';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Gem, Settings, Users, ShoppingCart, FileText, Menu, PlusCircle, Pencil, Trash } from 'lucide-react';
import AdminUsers from '@/components/admin-users';
import AdminAddProduct from '@/components/admin-add-product';
import AdminLegalPages from '@/components/admin-legal-pages';
import AdminMenuItems from '@/components/admin-menu-items';
import AdminManageProducts from '@/components/admin-manage-products';

type AdminSection = 'users' | 'addProduct' | 'manageProducts' | 'legal' | 'menu';

export default function AdminDashboard() {
  const { isMobile } = useSidebar();
  const [activeSection, setActiveSection] = useState<AdminSection>('users');

  const renderSection = () => {
    switch (activeSection) {
      case 'users':
        return <AdminUsers />;
      case 'addProduct':
        return <AdminAddProduct />;
      case 'manageProducts':
        return <AdminManageProducts />;
      case 'legal':
        return <AdminLegalPages />;
      case 'menu':
        return <AdminMenuItems />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-5rem)]">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Gem className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tighter">Admin</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveSection('users')} isActive={activeSection === 'users'}>
                <Users />
                <span>Users</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('addProduct')} isActive={activeSection === 'addProduct'}>
                    <PlusCircle />
                    <span>Add Product</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setActiveSection('manageProducts')} isActive={activeSection === 'manageProducts'}>
                    <ShoppingCart />
                    <span>Manage Products</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveSection('legal')} isActive={activeSection === 'legal'}>
                <FileText />
                <span>Legal Pages</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setActiveSection('menu')} isActive={activeSection === 'menu'}>
                <Menu />
                <span>Menu Items</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="p-4 md:p-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="font-headline text-3xl font-extrabold tracking-tighter capitalize">
                    {activeSection.replace(/([A-Z])/g, ' $1')}
                </h1>
                {isMobile && <SidebarTrigger />}
            </div>
            {renderSection()}
        </div>
      </SidebarInset>
    </div>
  );
}
