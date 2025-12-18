import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  stock_id: string | null;
  phone_name: string;
  quantity: number;
  buying_price: number;
  selling_price: number;
  expenses: number;
  profit: number;
  customer_name: string | null;
  vendor: string | null;
  sale_date: string;
  payment_status: 'paid' | 'pending' | 'partial';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const PAYMENT_STATUS = ['paid', 'pending', 'partial'] as const;

export function useSales() {
  const queryClient = useQueryClient();

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sales')
        .select('*')
        .order('sale_date', { ascending: false });
      
      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      return data as unknown as Sale[];
    },
  });

  const addSale = useMutation({
    mutationFn: async (item: Omit<Sale, 'id' | 'created_at' | 'updated_at' | 'profit'>) => {
      // Calculate profit
      const revenue = item.selling_price * item.quantity;
      const cost = item.buying_price * item.quantity;
      const profit = revenue - cost - item.expenses;
      
      // Just insert the sale - database trigger will handle inventory automatically
      const { data, error } = await (supabase as any)
        .from('sales')
        .insert({
          ...item,
          profit,
        })
        .select();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale recorded successfully. Stock updated automatically.' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to add sale', 
        variant: 'destructive' 
      });
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ...item }: Partial<Sale> & { id: string }) => {
      // Recalculate profit if relevant fields changed
      if (item.selling_price !== undefined || item.buying_price !== undefined || 
          item.quantity !== undefined || item.expenses !== undefined) {
        
        // Fetch current values to fill in any missing ones
        const { data: current } = await (supabase as any)
          .from('sales')
          .select('selling_price, buying_price, quantity, expenses')
          .eq('id', id)
          .single();
        
        const selling = item.selling_price ?? current.selling_price;
        const buying = item.buying_price ?? current.buying_price;
        const qty = item.quantity ?? current.quantity;
        const expenses = item.expenses ?? current.expenses;
        
        item.profit = (selling * qty) - (buying * qty) - expenses;
      }
      
      // Just update the sale - database trigger will handle inventory automatically
      const { data, error } = await (supabase as any)
        .from('sales')
        .update(item)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Sale updated successfully' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to update sale', 
        variant: 'destructive' 
      });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      // Just delete the sale - database trigger will restore inventory automatically
      const { error } = await (supabase as any)
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale deleted and stock restored automatically!' 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to delete sale', 
        variant: 'destructive' 
      });
    },
  });

  const totalSales = sales.reduce((sum, sale) => sum + (sale.selling_price * sale.quantity), 0);
  const totalExpenses = sales.reduce((sum, sale) => sum + sale.expenses, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalCost = sales.reduce((sum, sale) => sum + (sale.buying_price * sale.quantity), 0);

  return {
    sales,
    isLoading,
    addSale,
    updateSale,
    deleteSale,
    totalSales,
    totalExpenses,
    totalProfit,
    totalCost,
  };
}
