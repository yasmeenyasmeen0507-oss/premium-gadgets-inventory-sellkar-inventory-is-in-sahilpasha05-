import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Receivable {
  id: string;
  customer_name: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export function useReceivables() {
  const queryClient = useQueryClient();

  const { data: receivables = [], isLoading } = useQuery({
    queryKey: ['balances_to_receive'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('balances_to_receive')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Receivable[];
    },
  });

  const addReceivable = useMutation({
    mutationFn: async (item: Omit<Receivable, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('balances_to_receive').insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances_to_receive'] });
      toast({ title: 'Success', description: 'Receivable added' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add receivable', variant: 'destructive' });
    },
  });

  const updateReceivable = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Receivable> & { id: string }) => {
      const { error } = await supabase.from('balances_to_receive').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances_to_receive'] });
      toast({ title: 'Success', description: 'Receivable updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update receivable', variant: 'destructive' });
    },
  });

  const deleteReceivable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('balances_to_receive').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balances_to_receive'] });
      toast({ title: 'Success', description: 'Receivable deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete receivable', variant: 'destructive' });
    },
  });

  const totalReceivables = receivables.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    receivables,
    isLoading,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    totalReceivables,
  };
}