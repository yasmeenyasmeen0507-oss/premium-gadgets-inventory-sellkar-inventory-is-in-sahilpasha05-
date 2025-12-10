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
  created_at:  string;
  updated_at:  string;
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
      console.log('Attempting to insert sale:', item);
      
      // Calculate profit:  (selling_price * quantity) - (buying_price * quantity) - expenses
      const revenue = item.selling_price * item.quantity;
      const cost = item.buying_price * item.quantity;
      const profit = revenue - cost - item.expenses;
      
      let willDeleteStock = false;
      let newQuantity = 0;
      
      // 1. First, check stock if stock_id is provided
      if (item.stock_id) {
        // Get current stock
        const { data: stockData, error: stockFetchError } = await (supabase as any)
          .from('phones_stock')
          .select('quantity, phone_name')
          .eq('id', item.stock_id)
          .single();

        if (stockFetchError) {
          console.error('Error fetching stock:', stockFetchError);
          throw new Error('Failed to fetch stock data');
        }

        // Check if enough stock available
        if (stockData. quantity < item.quantity) {
          throw new Error(`Insufficient stock.  Available: ${stockData.quantity}, Required: ${item.quantity}`);
        }

        // Calculate new stock quantity
        newQuantity = stockData.quantity - item.quantity;
        willDeleteStock = newQuantity === 0;
        
        console.log(`Stock check: Current=${stockData.quantity}, Selling=${item.quantity}, Remaining=${newQuantity}, WillDelete=${willDeleteStock}`);
      }
      
      // 2. Insert the sale FIRST (before modifying stock)
      const insertData = {
        ...item,
        profit,
        // If we're going to delete stock, set stock_id to null in the sale record
        stock_id: willDeleteStock ? null : item.stock_id,
      };
      
      const { data: saleData, error:  saleError } = await (supabase as any)
        .from('sales')
        .insert(insertData)
        .select();
      
      if (saleError) {
        console.error('Supabase insert error:', saleError);
        throw saleError;
      }
      
      console.log('Sale recorded successfully:', saleData);
      
      // 3. NOW update or delete the stock
      if (item.stock_id) {
        if (willDeleteStock) {
          console.log('Deleting stock item (sold out)');
          
          const { error: stockDeleteError } = await (supabase as any)
            .from('phones_stock')
            .delete()
            .eq('id', item.stock_id);

          if (stockDeleteError) {
            console.error('Error deleting stock:', stockDeleteError);
            console.warn('Stock deletion failed but sale was recorded');
          } else {
            console.log('Stock item removed from inventory (sold out)');
          }
        } else {
          // Update the quantity
          const { error: stockUpdateError } = await (supabase as any)
            .from('phones_stock')
            .update({ quantity: newQuantity })
            .eq('id', item.stock_id);

          if (stockUpdateError) {
            console. error('Error updating stock:', stockUpdateError);
            console.warn('Stock update failed but sale was recorded');
          } else {
            console.log(`Stock updated successfully.  New quantity: ${newQuantity}`);
          }
        }
      }
      
      return saleData;
    },
    onSuccess:  () => {
      queryClient. invalidateQueries({ queryKey:  ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale recorded successfully.  Stock updated.' 
      });
    },
    onError: (error: any) => {
      console.error('Add sale mutation error:', error);
      toast({ 
        title: 'Error', 
        description:  error?. message || 'Failed to add sale', 
        variant: 'destructive' 
      });
    },
  });

  const updateSale = useMutation({
    mutationFn:  async ({ id, ...item }:  Partial<Sale> & { id: string }) => {
      console.log('Attempting to update sale:', { id, item });
      
      // Get the original sale to check if quantity changed
      const { data: originalSale, error: fetchError } = await (supabase as any)
        .from('sales')
        .select('quantity, stock_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching original sale:', fetchError);
        throw new Error('Failed to fetch original sale data');
      }

      // If quantity changed and stock_id exists, adjust stock
      if (item.quantity !== undefined && originalSale. stock_id && item.quantity !== originalSale.quantity) {
        const quantityDiff = item.quantity - originalSale.quantity;
        
        const { data: stockData, error: stockFetchError } = await (supabase as any)
          .from('phones_stock')
          .select('quantity')
          .eq('id', originalSale.stock_id)
          .single();

        if (!stockFetchError && stockData) {
          const newStockQuantity = stockData.quantity - quantityDiff;
          
          if (newStockQuantity < 0) {
            throw new Error('Insufficient stock.  Cannot increase sale quantity.');
          }

          // If new quantity is 0, we need to set stock_id to null before deleting
          if (newStockQuantity === 0) {
            // Update sale to remove stock_id reference
            await (supabase as any)
              .from('sales')
              .update({ stock_id: null })
              .eq('id', id);
            
            // Then delete stock
            await (supabase as any)
              .from('phones_stock')
              .delete()
              .eq('id', originalSale. stock_id);
            
            console.log('Stock deleted (quantity reached 0)');
          } else {
            // Otherwise update quantity
            await (supabase as any)
              .from('phones_stock')
              .update({ quantity: newStockQuantity })
              .eq('id', originalSale.stock_id);
          }
        }
      }
      
      // Recalculate profit if prices, quantity, or expenses changed
      if (item.selling_price !== undefined || item.buying_price !== undefined || item.quantity !== undefined || item.expenses !== undefined) {
        const selling = item.selling_price ??  0;
        const buying = item.buying_price ?? 0;
        const qty = item.quantity ?? 1;
        const expenses = item.expenses ?? 0;
        item.profit = (selling * qty) - (buying * qty) - expenses;
      }
      
      const { data, error } = await (supabase as any)
        .from('sales')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Sale updated successfully' });
    },
    onError: (error: any) => {
      console.error('Update sale mutation error:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to update sale', 
        variant: 'destructive' 
      });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      console.log('Attempting to delete sale:', id);
      
      // Simply delete the sale - don't restore stock
      const { error:  deleteError } = await (supabase as any)
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }
      
      console.log('Sale deleted successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale deleted successfully' 
      });
    },
    onError: (error: any) => {
      console.error('Delete sale mutation error:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to delete sale', 
        variant: 'destructive' 
      });
    },
  });

  const totalSales = sales.reduce((sum, sale) => sum + (sale.selling_price * sale.quantity), 0);
  const totalExpenses = sales. reduce((sum, sale) => sum + sale.expenses, 0);
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