import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PhoneStock {
  id:   string;
  phone_name:   string;
  quantity:  number;
  buying_price:  number;
  selling_price: number;
  vendor: string | null;
  purchase_date:  string | null;
  created_at:   string;
  updated_at:  string;
}

export const VENDORS = [
  'Sandeep',
  'Abubakar',
  'Website',
  'Anees',
] as const;

export type Vendor = typeof VENDORS[number];

export function useStock() {
  const queryClient = useQueryClient();

  const { data: stock = [], isLoading } = useQuery({
    queryKey: ['phones_stock'],
    queryFn:  async () => {
      const { data, error } = await supabase
        .from('phones_stock')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      return data as unknown as PhoneStock[];
    },
  });

  const addStock = useMutation({
    mutationFn: async (item: Omit<PhoneStock, 'id' | 'created_at' | 'updated_at' | 'selling_price'>) => {
      console.log('Attempting to insert:', item);
      
      const insertData = {
        phone_name: item.phone_name,
        quantity: item.quantity,
        buying_price: item.buying_price,
        selling_price: 0,
        vendor: item. vendor,
        purchase_date: item. purchase_date,
      };
      
      const { data, error } = await supabase
        .from('phones_stock')
        .insert(insertData)
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Insert successful:', data);
      return data;
    },
    onSuccess:  () => {
      queryClient. invalidateQueries({ queryKey:  ['phones_stock'] });
      toast({ title: 'Success', description:  'Phone added to stock' });
    },
    onError: (error:  any) => {
      console.error('Add stock mutation error:', error);
      toast({ 
        title: 'Error', 
        description: error?. message || 'Failed to add phone', 
        variant: 'destructive' 
      });
    },
  });

  const updateStock = useMutation({
    mutationFn: async ({ id, ...item }: Partial<PhoneStock> & { id: string }) => {
      console.log('Attempting to update:', { id, item });
      
      const { data, error } = await supabase
        .from('phones_stock')
        .update(item)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      return data;
    },
    onSuccess:  () => {
      queryClient. invalidateQueries({ queryKey:  ['phones_stock'] });
      toast({ title: 'Success', description: 'Stock updated' });
    },
    onError: (error: any) => {
      console.error('Update stock mutation error:', error);
      toast({ 
        title:  'Error', 
        description: error?.message || 'Failed to update stock', 
        variant: 'destructive' 
      });
    },
  });

  const deleteStock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase. from('phones_stock').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description:  'Phone removed from stock' });
    },
    onError: (error: any) => {
      console.error('Delete stock mutation error:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to delete phone', 
        variant: 'destructive' 
      });
    },
  });

  const totalStockValue = stock. reduce((sum, item) => sum + (item.quantity * item.buying_price), 0);

  // Calculate vendor-wise totals
  const vendorTotals = stock.reduce((acc, item) => {
    if (item.vendor) {
      if (! acc[item.vendor]) {
        acc[item.vendor] = { count: 0, total: 0 };
      }
      acc[item.vendor].count += item.quantity;
      acc[item.vendor].total += item.quantity * item.buying_price;
    }
    return acc;
  }, {} as Record<string, { count: number; total:  number }>);

  return {
    stock,
    isLoading,
    addStock,
    updateStock,
    deleteStock,
    totalStockValue,
    vendorTotals,
  };
}