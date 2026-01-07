import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList,
  CommandSeparator
} from '@/components/ui/command';
import { 
  LayoutDashboard, 
  Users, 
  History, 
  BarChart3, 
  Building2, 
  Settings,
  ShieldCheck,
  Database,
  FileCheck,
  Search,
  HelpCircle,
  LogOut,
  Pencil,
  RotateCcw,
  UserPlus,
  TestTube,
  Receipt,
  FileText,
  CalendarPlus
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGlobalActions } from '@/contexts/GlobalActionsContext';
import { useRecentPatients } from '@/hooks/useRecentPatients';

interface Patient {
  id: string;
  patient_id: string;
  full_name: string;
  phone: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { toast } = useToast();
  const { openDialog } = useGlobalActions();
  const { recentPatients } = useRecentPatients();

  // Keyboard shortcuts for command palette and quick actions
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K to toggle command palette
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
        return;
      }

      // Alt+key shortcuts for quick actions (only when not in input fields)
      if (e.altKey && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        if (!isInputField) {
          const shortcutMap: Record<string, () => void> = {
            'p': () => openDialog('patient'),
            'r': () => openDialog('report'),
            'b': () => openDialog('bill'),
            'd': () => openDialog('document'),
            'f': () => openDialog('followup'),
          };

          if (shortcutMap[e.key.toLowerCase()]) {
            e.preventDefault();
            shortcutMap[e.key.toLowerCase()]();
          }
        }
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [openDialog]);

  // Fetch patients when search changes
  useEffect(() => {
    if (open && search && profile?.lab_id) {
      fetchPatients();
    }
  }, [search, open, profile?.lab_id]);

  const fetchPatients = async () => {
    if (!profile?.lab_id) return;

    try {
      let query = supabase
        .from('patients')
        .select('id, patient_id, full_name, phone')
        .eq('lab_id', profile.lab_id)
        .limit(5);

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,patient_id.ilike.%${search}%,phone.ilike.%${search}%`);
      }

      const { data } = await query;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleNavigate = useCallback((path: string) => {
    setOpen(false);
    navigate(path);
  }, [navigate]);

  const handlePatientSelect = useCallback((patientId: string) => {
    setOpen(false);
    navigate(`/patient-history?id=${patientId}`);
  }, [navigate]);

  const handleSignOut = async () => {
    setOpen(false);
    await signOut();
    navigate('/auth');
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully.',
    });
  };

  const canAccess = (roles?: string[]) => {
    if (!roles || !profile) return true;
    return roles.includes(profile.role);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen} data-tour="command-palette">
      <CommandInput 
        placeholder="Search patients, navigate, or run commands..." 
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Recently Viewed Patients */}
        {!search && recentPatients.length > 0 && (
          <>
            <CommandGroup heading="Recently Viewed">
              {recentPatients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handlePatientSelect(patient.id)}
                  className="cursor-pointer"
                >
                  <History className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{patient.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {patient.patient_id} {patient.phone && `• ${patient.phone}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Patients Search Results */}
        {search && patients.length > 0 && (
          <>
            <CommandGroup heading="Patients">
              {patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  onSelect={() => handlePatientSelect(patient.id)}
                  className="cursor-pointer"
                >
                  <Users className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span>{patient.full_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {patient.patient_id} • {patient.phone}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => handleNavigate('/dashboard')} className="cursor-pointer">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => handleNavigate('/patient-history')} className="cursor-pointer">
            <History className="mr-2 h-4 w-4" />
            <span>Patient History</span>
          </CommandItem>
          {canAccess(['admin', 'lab_admin', 'super_admin']) && (
            <CommandItem onSelect={() => handleNavigate('/analytics')} className="cursor-pointer">
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Analytics</span>
            </CommandItem>
          )}
        </CommandGroup>

        {/* Admin */}
        {canAccess(['admin', 'lab_admin', 'super_admin']) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Administration">
              {canAccess(['admin', 'lab_admin']) && (
                <>
                  <CommandItem onSelect={() => handleNavigate('/lab-profile')} className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    <span>Lab Profile</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleNavigate('/branch-settings')} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Branch Settings</span>
                  </CommandItem>
                  <CommandItem onSelect={() => handleNavigate('/api-settings')} className="cursor-pointer">
                    <FileCheck className="mr-2 h-4 w-4" />
                    <span>API Settings</span>
                  </CommandItem>
                </>
              )}
              <CommandItem onSelect={() => handleNavigate('/audit-logs')} className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Audit Logs</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Super Admin */}
        {canAccess(['super_admin']) && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Super Admin">
              <CommandItem onSelect={() => handleNavigate('/super-admin')} className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Super Admin</span>
              </CommandItem>
              <CommandItem onSelect={() => handleNavigate('/super-admin/data-management')} className="cursor-pointer">
                <Database className="mr-2 h-4 w-4" />
                <span>Data Management</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {/* Quick Actions */}
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              openDialog('patient');
            }} 
            className="cursor-pointer"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Add Patient</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+P</span>
          </CommandItem>
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              openDialog('report');
            }} 
            className="cursor-pointer"
          >
            <TestTube className="mr-2 h-4 w-4" />
            <span>Add Test Report</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+R</span>
          </CommandItem>
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              openDialog('bill');
            }} 
            className="cursor-pointer"
          >
            <Receipt className="mr-2 h-4 w-4" />
            <span>Create Bill</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+B</span>
          </CommandItem>
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              openDialog('document');
            }} 
            className="cursor-pointer"
          >
            <FileText className="mr-2 h-4 w-4" />
            <span>Upload Document</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+D</span>
          </CommandItem>
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              openDialog('followup');
            }} 
            className="cursor-pointer"
          >
            <CalendarPlus className="mr-2 h-4 w-4" />
            <span>Add Follow-up</span>
            <span className="ml-auto text-xs text-muted-foreground">Alt+F</span>
          </CommandItem>
        </CommandGroup>

        {/* Other Actions */}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              navigate('/dashboard');
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('dashboard-edit-mode'));
              }, 100);
            }} 
            className="cursor-pointer"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit Dashboard Layout</span>
          </CommandItem>
          <CommandItem 
            onSelect={() => {
              setOpen(false);
              window.dispatchEvent(new CustomEvent('dashboard-reset-layout'));
              toast({
                title: "Layout Reset",
                description: "Dashboard layout has been reset to default",
              });
            }} 
            className="cursor-pointer"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            <span>Reset Dashboard Layout</span>
          </CommandItem>
          <CommandItem onSelect={handleSignOut} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign Out</span>
          </CommandItem>
        </CommandGroup>

        {/* Help */}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem className="cursor-pointer">
            <HelpCircle className="mr-2 h-4 w-4" />
            <span>Keyboard Shortcuts</span>
            <span className="ml-auto text-xs text-muted-foreground">?</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
