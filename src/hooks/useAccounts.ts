import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Account {
  id: string;
  account_name: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export function useAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ['account_balances'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_balances')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Account[];
    },
  });

  const addAccount = useMutation({
    mutationFn: async (item: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('account_balances').insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_balances'] });
      toast({ title: 'Success', description: 'Account added' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add account', variant: 'destructive' });
    },
  });

  const updateAccount = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Account> & { id: string }) => {
      const { error } = await supabase.from('account_balances').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_balances'] });
      toast({ title: 'Success', description: 'Account updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update account', variant: 'destructive' });
    },
  });

  const deleteAccount = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('account_balances').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['account_balances'] });
      toast({ title: 'Success', description: 'Account deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
    },
  });

  const totalAccountBalance = accounts.reduce((sum, item) => sum + Number(item.balance), 0);

  return {
    accounts,
    isLoading,
    addAccount,
    updateAccount,
    deleteAccount,
    totalAccountBalance,
  };
}