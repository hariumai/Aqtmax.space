
'use client';
import { useState, createContext, useContext, ReactNode } from 'react';
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
import { Settings, Users, ShoppingCart, FileText, Menu as MenuIcon, PlusCircle, ListOrdered, Shapes, Bell } from 'lucide-react';
import AdminUsers from '@/components/admin-users';
import AdminAddProduct from '@/components/admin-add-product';
import AdminLegalPages from '@/components/admin-legal-pages';
import AdminMenuItems from '@/components/admin-menu-items';
import AdminManageProducts from '@/components/admin-manage-products';
import AdminOrders from '@/components/admin-orders';
import AdminSettings from '@/components/admin-settings';
import AdminCategories from './admin-categories';
import { Loader2 } from 'lucide-react';
import AdminNotifications from './admin-notifications';

export type AdminSection = 'users' | 'addProduct' | 'manageProducts' | 'orders' | 'legal' | 'menu' | 'settings' | 'categories' | 'notifications';

type AdminDashboardContextType = {
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;
};

const AdminDashboardContext = createContext<AdminDashboardContextType | null>(null);

export function useAdminDashboard() {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error('useAdminDashboard must be used within an AdminDashboardProvider');
  }
  return context;
}

export function AdminDashboardProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<AdminSection>('orders');
  return (
    <AdminDashboardContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </AdminDashboardContext.Provider>
  );
}


export default function AdminDashboard({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeSection, setActiveSection } = useAdminDashboard();


  const handleSectionClick = (section: AdminSection) => {
    setActiveSection(section);
    if(isMobile) {
      setOpenMobile(false);
    }
  }

  const renderSection = () => {
    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }
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
      case 'categories':
        return <AdminCategories />;
      case 'notifications':
        return <AdminNotifications />;
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
      case 'categories': return 'Categories';
      case 'notifications': return 'Notifications';
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
                <SidebarMenuButton onClick={() => handleSectionClick('categories')} isActive={activeSection === 'categories'}>
                    <Shapes />
                    <span>Categories</span>
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
                <SidebarMenuButton onClick={() => handleSectionClick('notifications')} isActive={activeSection === 'notifications'}>
                    <Bell />
                    <span>Notifications</span>
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
                <MenuIcon />
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
      <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8">
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
