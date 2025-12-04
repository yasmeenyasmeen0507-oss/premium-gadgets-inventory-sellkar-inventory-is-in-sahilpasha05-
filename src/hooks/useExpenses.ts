import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Expense {
  id: string;
  expense_name: string;
  amount: number;
  created_at: string;
  updated_at: string;
}

export function useExpenses() {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Expense[];
    },
  });

  const addExpense = useMutation({
    mutationFn: async (item: Omit<Expense, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('expenses').insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense added' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add expense', variant: 'destructive' });
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Expense> & { id: string }) => {
      const { error } = await supabase.from('expenses').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update expense', variant: 'destructive' });
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense deleted' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete expense', variant: 'destructive' });
    },
  });

  const totalExpenses = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    expenses,
    isLoading,
    addExpense,
    updateExpense,
    deleteExpense,
    totalExpenses,
  };
}