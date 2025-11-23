import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AddOrganizationForm } from '@/components/forms/AddOrganizationForm';
import { AddBranchForm } from '@/components/forms/AddBranchForm';
import { AddUserForm } from '@/components/forms/AddUserForm';
import { AddTestTypeForm } from '@/components/forms/AddTestTypeForm';
import EditUserDialog from '@/components/forms/EditUserDialog';
import EditBranchDialog from '@/components/forms/EditBranchDialog';
import { Edit, Database, Trash2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  created_at: string;
}

interface Branch {
  id: string;
  name: string;
  branch_code: string;
  location: string;
  phone: string;
  organization_id: string;
  lab_id?: string;
  organization: {
    id: string;
    name: string;
  };
  lab: {
    id: string;
    name: string;
  } | null;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  branch_id?: string;
  branch: {
    name: string;
    organization: {
      name: string;
    };
  } | null;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditBranchDialogOpen, setIsEditBranchDialogOpen] = useState(false);

  useEffect(() => {
    // Allow both super_admin and lab_admin to access this page
    if (profile && profile.role !== 'super_admin' && profile.role !== 'lab_admin') {
      navigate('/dashboard');
      return;
    }
    
    if (profile?.role === 'super_admin' || profile?.role === 'lab_admin') {
      fetchData();
    }
  }, [profile, navigate]);

  const fetchData = async () => {
    try {
      const [organizationsRes, branchesRes, usersRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        supabase.from('branches').select(`
          *,
          organization:organizations(id, name),
          lab:labs(id, name)
        `).order('name'),
        supabase.from('profiles').select(`
          *,
          branch:branches(
            name,
            organization:organizations(name)
          )
        `).order('full_name')
      ]);

      setOrganizations(organizationsRes.data || []);
      setBranches(branchesRes.data as Branch[] || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Loading...</h2>
          <p className="text-muted-foreground">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Super Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || profile?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/audit-logs')} 
              variant="secondary"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Audit Logs
            </Button>
            <Button 
              onClick={() => navigate('/super-admin/data-management')} 
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Data Management
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Organizations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{organizations.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Branches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{branches.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="test-types">Test Types</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-6">
            <AddOrganizationForm onSuccess={fetchData} />
            
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Contact Email</TableHead>
                      <TableHead>Contact Phone</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {organizations.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell>{org.description || '-'}</TableCell>
                        <TableCell>{org.contact_email || '-'}</TableCell>
                        <TableCell>{org.contact_phone || '-'}</TableCell>
                        <TableCell>{new Date(org.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branches" className="space-y-6">
            <AddBranchForm onSuccess={fetchData} />
            
            <Card>
              <CardHeader>
                <CardTitle>Branches</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Associated Lab</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">{branch.name}</TableCell>
                        <TableCell>{branch.organization?.name}</TableCell>
                        <TableCell>{branch.lab?.name || '-'}</TableCell>
                        <TableCell>{branch.location || '-'}</TableCell>
                        <TableCell>{branch.phone || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingBranch(branch);
                              setIsEditBranchDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <AddUserForm onSuccess={fetchData} />
            <Card>
              <CardHeader>
                <CardTitle>System Users</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.full_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {user.role?.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.branch?.name || '-'}</TableCell>
                        <TableCell>{user.branch?.organization?.name || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingUser(user);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="test-types" className="space-y-4 overflow-auto">
          <AddTestTypeForm />
        </TabsContent>
      </Tabs>
      </main>
      
      <EditUserDialog
        user={editingUser}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setEditingUser(null);
        }}
        onSuccess={fetchData}
      />
      
      <EditBranchDialog
        branch={editingBranch}
        isOpen={isEditBranchDialogOpen}
        onClose={() => {
          setIsEditBranchDialogOpen(false);
          setEditingBranch(null);
        }}
        onSuccess={fetchData}
      />
    </div>
  );
}