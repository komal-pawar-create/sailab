import { 
  LayoutDashboard, 
  Settings, 
  Building2, 
  BarChart3,
  ShieldCheck,
  Database,
  History,
  FileCheck,
  LogOut,
  ClipboardList,
  Globe,
  AlertCircle,
  FileSpreadsheet,
  Users,
  CreditCard,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
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

// Main items - exclude operational items for super_admin
const mainItems: NavItem[] = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'lab_admin', 'operator_1', 'operator_2', 'operator_3', 'branch_operator'] },
  { title: 'Reports', url: '/reports', icon: FileSpreadsheet, roles: ['admin', 'lab_admin', 'operator_1', 'operator_2', 'operator_3', 'branch_operator'] },
  { title: 'Outstanding Report', url: '/outstanding-report', icon: AlertCircle, roles: ['admin', 'lab_admin', 'operator_1', 'operator_2', 'operator_3', 'branch_operator'] },
  { title: 'Patient History', url: '/patient-history', icon: History, roles: ['admin', 'lab_admin', 'operator_1', 'operator_2', 'operator_3', 'branch_operator'] },
  { title: 'Follow-ups', url: '/followups', icon: ClipboardList, roles: ['admin', 'lab_admin', 'operator_1', 'operator_2', 'operator_3', 'branch_operator'] },
  { title: 'Analytics', url: '/analytics', icon: BarChart3, roles: ['admin', 'lab_admin', 'branch_operator'] },
];

const adminItems: NavItem[] = [
  { title: 'Lab Profile', url: '/lab-profile', icon: Building2, roles: ['admin', 'lab_admin'] },
  { title: 'Branch Settings', url: '/branch-settings', icon: Settings, roles: ['admin', 'lab_admin'] },
  { title: 'API Settings', url: '/api-settings', icon: FileCheck, roles: ['admin', 'lab_admin'] },
  { title: 'Audit Logs', url: '/audit-logs', icon: ShieldCheck, roles: ['admin', 'lab_admin', 'super_admin'] },
];

const superAdminItems: NavItem[] = [
  { title: 'Super Admin', url: '/super-admin', icon: ShieldCheck, roles: ['super_admin'] },
  { title: 'Sales & Leads', url: '/sales-leads', icon: Users, roles: ['super_admin'] },
  { title: 'Subscriptions', url: '/super-admin?tab=subscriptions', icon: CreditCard, roles: ['super_admin'] },
  { title: 'Landing Page', url: '/super-admin?tab=landing', icon: Globe, roles: ['super_admin'] },
  { title: 'Data Management', url: '/super-admin/data-management', icon: Database, roles: ['super_admin'] },
];


export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const filterByRole = (items: NavItem[]) => {
    if (!profile) return [];
    return items.filter(item => !item.roles || item.roles.includes(profile.role));
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: t('app.errors.failed'),
        description: t('app.errors.signOutError'),
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
    return t(`app.roles.${role}`) || role;
  };

  const getNavItemTitle = (title: string) => {
    const titleMap: Record<string, string> = {
      'Dashboard': t('app.sidebar.dashboard'),
      'Reports': t('app.sidebar.reports'),
      'Outstanding Report': t('app.sidebar.outstandingReport'),
      'Patient History': t('app.sidebar.patientHistory'),
      'Follow-ups': t('app.sidebar.followups'),
      'Analytics': t('app.sidebar.analytics'),
      'Lab Profile': t('app.sidebar.labProfile'),
      'Branch Settings': t('app.sidebar.branchSettings'),
      'API Settings': t('app.sidebar.apiSettings'),
      'Audit Logs': t('app.sidebar.auditLogs'),
      'Super Admin': t('app.sidebar.superAdmin'),
      'Sales & Leads': t('app.sidebar.salesLeads'),
      'Subscriptions': t('app.sidebar.subscriptions'),
      'Landing Page': t('app.sidebar.landingPage'),
      'Data Management': t('app.sidebar.dataManagement'),
    };
    return titleMap[title] || title;
  };

  const filteredMainItems = filterByRole(mainItems);
  
  const filteredAdminItems = filterByRole(adminItems);
  const filteredSuperAdminItems = filterByRole(superAdminItems);


  return (
    <Sidebar
      collapsible="icon"
      data-tour="sidebar"
    >
      <SidebarContent>
        {/* Main Navigation */}
        {filteredMainItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>{t('app.sidebar.main')}</SidebarGroupLabel>
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
                        {!isCollapsed && <span>{getNavItemTitle(item.title)}</span>}
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
            <SidebarGroupLabel>{t('app.sidebar.administration')}</SidebarGroupLabel>
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
                        {!isCollapsed && <span>{getNavItemTitle(item.title)}</span>}
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
            <SidebarGroupLabel>{t('app.sidebar.superAdmin')}</SidebarGroupLabel>
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
                        {!isCollapsed && <span>{getNavItemTitle(item.title)}</span>}
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
