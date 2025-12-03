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
  FileCheck,
  LogOut,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
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
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  const filterByRole = (items: NavItem[]) => {
    if (!profile) return [];
    return items.filter(item => !item.roles || item.roles.includes(profile.role));
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      navigate('/auth');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      super_admin: 'Super Admin',
      lab_admin: 'Lab Admin',
      admin: 'Admin',
      operator_1: 'Operator 1',
      operator_2: 'Operator 2',
      operator_3: 'Operator 3',
      branch_operator: 'Branch Operator',
    };
    return roleLabels[role] || role;
  };

  const filteredMainItems = filterByRole(mainItems);
  const filteredAdminItems = filterByRole(adminItems);
  const filteredSuperAdminItems = filterByRole(superAdminItems);

  const handleEditDashboard = () => {
    if (location.pathname !== '/dashboard') {
      navigate('/dashboard');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('dashboard-edit-mode'));
      }, 100);
    } else {
      window.dispatchEvent(new CustomEvent('dashboard-edit-mode'));
    }
  };

  const handleResetDashboard = () => {
    window.dispatchEvent(new CustomEvent('dashboard-reset-layout'));
  };

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
                {/* Dashboard customization options */}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleEditDashboard}
                    className="hover:bg-sidebar-accent cursor-pointer"
                  >
                    <Pencil className="h-4 w-4" />
                    {!isCollapsed && <span>Edit Dashboard</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    onClick={handleResetDashboard}
                    className="hover:bg-sidebar-accent cursor-pointer"
                  >
                    <RotateCcw className="h-4 w-4" />
                    {!isCollapsed && <span>Reset Dashboard</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
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

      {/* User Profile & Logout */}
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-3 p-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {profile?.full_name ? getInitials(profile.full_name) : 'U'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {profile?.role ? getRoleLabel(profile.role) : ''}
              </p>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSignOut}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
