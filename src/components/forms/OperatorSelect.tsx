import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Operator {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
}

interface OperatorSelectProps {
  selectedOperator: string;
  onOperatorChange: (operatorId: string) => void;
}

export const OperatorSelect = ({ selectedOperator, onOperatorChange }: OperatorSelectProps) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const { profile } = useAuth();

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, role')
        .in('role', ['operator_1', 'operator_2', 'operator_3'])
        .not('user_id', 'eq', '')
        .order('full_name');
      
      // Filter out any records with empty user_id
      setOperators((data || []).filter(op => op.user_id && op.user_id.trim() !== ''));
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  // Only show operator selection for admins and lab_admins
  if (!profile?.role || !['admin', 'lab_admin'].includes(profile.role)) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="operator">Operator (Entry flagged by)</Label>
      <Select value={selectedOperator} onValueChange={onOperatorChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem key={operator.user_id} value={operator.user_id}>
              {operator.full_name} ({operator.role.replace('_', ' ')})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};