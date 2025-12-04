import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhoneStock {
  id: string;
  phone_name: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  created_at: string;
  updated_at: string;
}

export function useStock() {
  const queryClient = useQueryClient();

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['phones_stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phones_stock')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PhoneStock[];
    },
  });

  const addStock = useMutation({
    mutationFn: async (item: Omit<PhoneStock, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('phones_stock').insert(item);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Phone added to stock' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to add phone', variant: 'destructive' });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, ...item }: Partial<PhoneStock> & { id: string }) => {
      const { error } = await supabase.from('phones_stock').update(item).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Stock updated' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'destructive' });
    },
  });

  const deleteStock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('phones_stock').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Phone removed from stock' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete phone', variant: 'destructive' });
    },
  });

  const totalStockValue = stock.reduce((sum, item) => sum + (item.quantity * item.selling_price), 0);

  return {
    stock,
    isLoading,
    addStock,
    updateStock,
    deleteStock,
    totalStockValue,
  };
}