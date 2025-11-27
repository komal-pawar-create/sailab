import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  Building2, 
  BarChart3,
  ShieldCheck,
  Database,
  History,
  FileCheck
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

interface NavItem {
  title: string;
  url: string;
  icon: any;
  roles?: string[];
}

const mainItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Patient History', url: '/patient-history', icon: History },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin', 'lab_admin', 'super_admin'] },
];

const adminItems: NavItem[] = [
  { title: 'Lab Profile', url: '/lab-profile', icon: Building2, roles: ['admin', 'lab_admin'] },
  { title: 'Branch Settings', url: '/branch-settings', icon: Settings, roles: ['admin', 'lab_admin'] },
  { title: 'API Settings', url: '/api-settings', icon: FileCheck, roles: ['admin', 'lab_admin'] },
  { title: 'Audit Logs', url: '/audit-logs', icon: ShieldCheck, roles: ['admin', 'lab_admin', 'super_admin'] },
];

const superAdminItems: NavItem[] = [
  { title: 'Super Admin', url: '/super-admin', icon: ShieldCheck, roles: ['super_admin'] },
  { title: 'Data Management', url: '/super-admin/data-management', icon: Database, roles: ['super_admin'] },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  const filterByRole = (items: NavItem[]) => {
    if (!profile) return [];
    return items.filter(item => !item.roles || item.roles.includes(profile.role));
  };

  const filteredMainItems = filterByRole(mainItems);
  const filteredAdminItems = filterByRole(adminItems);
  const filteredSuperAdminItems = filterByRole(superAdminItems);

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent>
        {/* Main Navigation */}
        {filteredMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredMainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        end 
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Navigation */}
        {filteredAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Super Admin Navigation */}
        {filteredSuperAdminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Super Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSuperAdminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className="hover:bg-sidebar-accent"
                        activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
