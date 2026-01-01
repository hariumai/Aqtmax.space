
'use client';
import { useAdminDashboard, type AdminSection } from './admin-dashboard';
import { cn } from '@/lib/utils';
import { ListOrdered, Users, ShoppingCart, Settings, PlusCircle, Menu as MenuIcon, Shapes, Bell, Mail } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const navItems: { section: AdminSection; label: string; icon: React.ElementType }[] = [
    { section: 'orders', label: 'Orders', icon: ListOrdered },
    { section: 'users', label: 'Users', icon: Users },
    { section: 'manageProducts', label: 'Products', icon: ShoppingCart },
    { section: 'addProduct', label: 'Add', icon: PlusCircle },
];

export default function AdminBottomNav() {
    const { activeSection, setActiveSection } = useAdminDashboard();
    const { isMobile, setOpenMobile } = useSidebar();

    if (!isMobile) {
        return null;
    }

    const createHandleClick = (section: AdminSection) => () => {
        setActiveSection(section);
    };

    return (
        <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 border-t border-border backdrop-blur-lg">
            <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
                {navItems.map(item => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.section}
                            type="button"
                            onClick={createHandleClick(item.section)}
                            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
                        >
                            <Icon
                                className={cn(
                                    'w-5 h-5 mb-1 text-muted-foreground transition-colors group-hover:text-primary',
                                    activeSection === item.section && 'text-primary'
                                )}
                            />
                            <span
                                className={cn(
                                    'text-xs text-muted-foreground transition-colors group-hover:text-primary',
                                    activeSection === item.section && 'text-primary'
                                )}
                            >
                                {item.label}
                            </span>
                        </button>
                    )
                })}
                <Sheet>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 group"
                        >
                            <MenuIcon className="w-5 h-5 mb-1 text-muted-foreground transition-colors group-hover:text-primary" />
                            <span className="text-xs text-muted-foreground transition-colors group-hover:text-primary">More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="w-full h-auto rounded-t-2xl bg-background/95 backdrop-blur-xl">
                        <div className="p-4">
                            <h3 className="mb-4 text-lg font-medium">More Options</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => { setActiveSection('notifications'); setOpenMobile(false);}} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <Bell className="w-6 h-6" />
                                   <span>Notifications</span>
                               </button>
                                <button onClick={() => { setActiveSection('contactForms'); setOpenMobile(false);}} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <Mail className="w-6 h-6" />
                                   <span>Contact Forms</span>
                               </button>
                                <button onClick={() => { setActiveSection('categories'); setOpenMobile(false);}} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <Shapes className="w-6 h-6" />
                                   <span>Categories</span>
                               </button>
                               <button onClick={() => { setActiveSection('legal'); setOpenMobile(false);}} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <Settings className="w-6 h-6" />
                                   <span>Legal Pages</span>
                               </button>
                               <button onClick={() => { setActiveSection('menu'); setOpenMobile(false); }} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <MenuIcon className="w-6 h-6" />
                                   <span>Menu Items</span>
                               </button>
                               <button onClick={() => { setActiveSection('settings'); setOpenMobile(false); }} className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                                   <Settings className="w-6 h-6" />
                                   <span>Settings</span>
                               </button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </div>
    );
}

    