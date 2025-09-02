import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface GlobalTestType {
  id: string;
  test_name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export function AddTestTypeForm() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testTypes, setTestTypes] = useState<GlobalTestType[]>([]);
  const [editingTestType, setEditingTestType] = useState<GlobalTestType | null>(null);
  const [formData, setFormData] = useState({
    test_name: '',
    description: '',
    category: '',
    is_active: true
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTestTypes();
  }, []);

  const fetchTestTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('global_test_types')
        .select('*')
        .order('category', { ascending: true })
        .order('test_name', { ascending: true });

      if (error) throw error;
      setTestTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching test types:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch test types",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      if (editingTestType) {
        // Update existing test type
        const { error } = await supabase
          .from('global_test_types')
          .update({
            test_name: formData.test_name,
            description: formData.description || null,
            category: formData.category || null,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTestType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Test type updated successfully",
        });
      } else {
        // Create new test type
        const { error } = await supabase
          .from('global_test_types')
          .insert({
            test_name: formData.test_name,
            description: formData.description || null,
            category: formData.category || null,
            is_active: formData.is_active,
            created_by: userData.user.id
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Test type added successfully",
        });
      }

      setOpen(false);
      resetForm();
      fetchTestTypes();
    } catch (error: any) {
      console.error('Error saving test type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save test type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testType: GlobalTestType) => {
    setEditingTestType(testType);
    setFormData({
      test_name: testType.test_name,
      description: testType.description || '',
      category: testType.category || '',
      is_active: testType.is_active
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_test_types')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test type deleted successfully",
      });
      fetchTestTypes();
    } catch (error: any) {
      console.error('Error deleting test type:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete test type",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      test_name: '',
      description: '',
      category: '',
      is_active: true
    });
    setEditingTestType(null);
  };

  const categories = ['Blood Tests', 'Urine Tests', 'Imaging', 'Pathology', 'Radiology', 'Other'];

  // Group test types by category
  const groupedTestTypes = testTypes.reduce((acc, testType) => {
    const category = testType.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(testType);
    return acc;
  }, {} as Record<string, GlobalTestType[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Test Types</CardTitle>
        <CardDescription>
          Manage platform-wide test types available to all labs and branches
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={open} onOpenChange={(isOpen) => {
          if (!isOpen) resetForm();
          setOpen(isOpen);
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Test Type
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingTestType ? 'Edit Test Type' : 'Add New Test Type'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test_name">Test Name *</Label>
                <Input
                  id="test_name"
                  value={formData.test_name}
                  onChange={(e) => setFormData({ ...formData, test_name: e.target.value })}
                  placeholder="Enter test name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter test description"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingTestType ? "Update" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <ScrollArea className="h-[500px]">
          {Object.entries(groupedTestTypes).map(([category, types]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">{category}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {types.map((testType) => (
                    <TableRow key={testType.id}>
                      <TableCell className="font-medium">{testType.test_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {testType.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={testType.is_active ? 'default' : 'secondary'}>
                          {testType.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(testType)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Test Type</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{testType.test_name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(testType.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}