import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { AddOrganizationForm } from '@/components/forms/AddOrganizationForm';
import { AddBranchForm } from '@/components/forms/AddBranchForm';
import { AddUserForm } from '@/components/forms/AddUserForm';
import { AddTestTypeForm } from '@/components/forms/AddTestTypeForm';
import { AddDemoVideoForm } from '@/components/forms/AddDemoVideoForm';
import { LandingPageManager } from '@/components/forms/LandingPageManager';
import { AddLabForm } from '@/components/forms/AddLabForm';
import { EditLabDialog } from '@/components/forms/EditLabDialog';
import { EditOrganizationDialog } from '@/components/forms/EditOrganizationDialog';
import EditUserDialog from '@/components/forms/EditUserDialog';
import EditBranchDialog from '@/components/forms/EditBranchDialog';
import { Edit, Database, Trash2, Settings, BarChart3, Video, Play, ExternalLink, Layout, Building2, UserX, UserCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const rolePermissions: Record<string, string[]> = {
  super_admin: [
    'Full system access',
    'Manage all organizations & labs',
    'Create & manage users',
    'Change user passwords',
    'Access all branches',
    'View audit logs',
    'Manage landing page content',
  ],
  lab_admin: [
    'Manage lab settings',
    'Access all branches in lab',
    'Create & manage operators',
    'View lab-wide reports',
    'Manage test types',
  ],
  branch_operator: [
    'Access assigned branch only',
    'Manage patients & bills',
    'Upload documents',
    'Create followups',
  ],
  operator_1: ['Branch-level access', 'Patient management', 'Billing operations'],
  operator_2: ['Branch-level access', 'Patient management', 'Billing operations'],
  operator_3: ['Branch-level access', 'Patient management', 'Billing operations'],
};

interface Organization {
  id: string;
  name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  created_at: string;
}

interface Lab {
  id: string;
  name: string;
  initials: string;
  organization_id: string | null;
  location: string | null;
  phone: string | null;
  admin_mobile_number: string | null;
  registration_number: string | null;
  gst_number: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  footer_text: string | null;
  terms_conditions: string | null;
  organization?: {
    name: string;
  };
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
  is_active?: boolean;
  branch: {
    name: string;
    organization: {
      name: string;
    };
  } | null;
}

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_type: string;
  thumbnail_url: string | null;
  duration: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export default function SuperAdmin() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [demoVideos, setDemoVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isEditBranchDialogOpen, setIsEditBranchDialogOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [isEditLabDialogOpen, setIsEditLabDialogOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [isEditOrgDialogOpen, setIsEditOrgDialogOpen] = useState(false);

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
      const [organizationsRes, labsRes, branchesRes, usersRes, demoVideosRes] = await Promise.all([
        supabase.from('organizations').select('*').order('name'),
        supabase.from('labs').select(`
          *,
          organization:organizations(name)
        `).order('name'),
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
        `).order('full_name'),
        supabase.from('demo_videos').select('*').order('display_order')
      ]);

      setOrganizations(organizationsRes.data || []);
      setLabs(labsRes.data as Lab[] || []);
      setBranches(branchesRes.data as Branch[] || []);
      setUsers(usersRes.data || []);
      setDemoVideos(demoVideosRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleVideoActive = async (video: DemoVideo) => {
    try {
      const { error } = await supabase
        .from('demo_videos')
        .update({ is_active: !video.is_active })
        .eq('id', video.id);

      if (error) throw error;
      toast.success(`Video ${!video.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to update video status');
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this demo video?')) return;
    
    try {
      const { error } = await supabase
        .from('demo_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;
      toast.success('Video deleted successfully');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to delete video');
    }
  };

  const getVideoTypeColor = (type: string) => {
    switch (type) {
      case 'youtube': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'vimeo': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'uploaded': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-muted text-muted-foreground';
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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-primary">Super Admin Dashboard</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant={
                        profile?.role === 'super_admin' ? 'success' : 
                        profile?.role === 'lab_admin' ? 'info' : 'muted'
                      } 
                      className="capitalize cursor-help"
                    >
                      {profile?.role?.replace(/_/g, ' ')}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold capitalize">{profile?.role?.replace(/_/g, ' ')} Permissions:</p>
                      <ul className="text-xs space-y-0.5">
                        {(rolePermissions[profile?.role || ''] || ['Standard access']).map((perm, idx) => (
                          <li key={idx}>• {perm}</li>
                        ))}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Welcome, {profile?.full_name || profile?.email}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => navigate('/analytics')} 
              variant="secondary"
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button 
              onClick={() => navigate('/audit-logs')} 
              variant="secondary"
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Audit Logs
            </Button>
            <Button 
              onClick={() => navigate('/api-settings')} 
              variant="secondary"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              API Settings
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                Total Labs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{labs.length}</div>
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
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.is_active !== false).length} active
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="labs" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Labs
            </TabsTrigger>
            <TabsTrigger value="branches">Branches</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="test-types">Test Types</TabsTrigger>
            <TabsTrigger value="demo-videos" className="flex items-center gap-1">
              <Video className="h-4 w-4" />
              Demo Videos
            </TabsTrigger>
            <TabsTrigger value="landing-page" className="flex items-center gap-1">
              <Layout className="h-4 w-4" />
              Landing Page
            </TabsTrigger>
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
                      <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingOrganization(org);
                              setIsEditOrgDialogOpen(true);
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

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-6">
            <AddLabForm onSuccess={fetchData} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Labs ({labs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {labs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No labs yet. Add your first lab above.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Lab Name</TableHead>
                        <TableHead>Initials</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labs.map((lab) => (
                        <TableRow key={lab.id}>
                          <TableCell className="font-medium">{lab.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{lab.initials}</Badge>
                          </TableCell>
                          <TableCell>{lab.organization?.name || '-'}</TableCell>
                          <TableCell>{lab.location || lab.city || '-'}</TableCell>
                          <TableCell>{lab.phone || '-'}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLab(lab);
                                setIsEditLabDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
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
                      <TableHead>Status</TableHead>
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
                      <TableRow key={user.id} className={user.is_active === false ? 'opacity-60' : ''}>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {user.is_active !== false ? (
                                  <UserCheck className="h-4 w-4 text-green-500" />
                                ) : (
                                  <UserX className="h-4 w-4 text-destructive" />
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {user.is_active !== false ? 'Active' : 'Disabled'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
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

        <TabsContent value="demo-videos" className="space-y-6">
          <AddDemoVideoForm onSuccess={fetchData} />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Demo Videos ({demoVideos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demoVideos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No demo videos yet. Add your first video above.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demoVideos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell className="font-mono">{video.display_order}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{video.title}</div>
                            {video.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {video.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getVideoTypeColor(video.video_type)}`}>
                            {video.video_type}
                          </span>
                        </TableCell>
                        <TableCell>{video.duration || '-'}</TableCell>
                        <TableCell>
                          <Switch
                            checked={video.is_active}
                            onCheckedChange={() => toggleVideoActive(video)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(video.video_url, '_blank')}
                              title="Open video"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteVideo(video.id)}
                              className="text-destructive hover:text-destructive"
                              title="Delete video"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="landing-page" className="space-y-6">
          <LandingPageManager />
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

      <EditLabDialog
        lab={editingLab}
        open={isEditLabDialogOpen}
        onOpenChange={(open) => {
          setIsEditLabDialogOpen(open);
          if (!open) setEditingLab(null);
        }}
        onSuccess={fetchData}
      />

      <EditOrganizationDialog
        organization={editingOrganization}
        open={isEditOrgDialogOpen}
        onOpenChange={(open) => {
          setIsEditOrgDialogOpen(open);
          if (!open) setEditingOrganization(null);
        }}
        onSuccess={fetchData}
      />
    </div>
  );
}