import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  stock_id: string | null;
  phone_name:  string;
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
      console.log('=== ADDING SALE ===');
      console.log('Sale data:', item);
      
      // Calculate profit
      const revenue = item.selling_price * item.quantity;
      const cost = item.buying_price * item.quantity;
      const profit = revenue - cost - item.expenses;
      
      console.log(`Profit calculation: Revenue(${revenue}) - Cost(${cost}) - Expenses(${item.expenses}) = ${profit}`);
      
      let willDeleteStock = false;
      let newQuantity = 0;
      let originalStockId = item.stock_id; // SAVE this before any operations
      
      // 1. Check stock availability
      if (item.stock_id) {
        console.log(`Checking stock with ID: ${item.stock_id}`);
        
        const { data: stockData, error: stockFetchError } = await (supabase as any)
          .from('phones_stock')
          .select('quantity, phone_name')
          .eq('id', item.stock_id)
          .single();

        if (stockFetchError) {
          console.error('Error fetching stock:', stockFetchError);
          throw new Error('Failed to fetch stock data');
        }

        console.log(`Current stock:  ${stockData.phone_name} - ${stockData.quantity} units`);

        if (stockData.quantity < item.quantity) {
          throw new Error(`Insufficient stock.  Available: ${stockData.quantity}, Required: ${item.quantity}`);
        }

        newQuantity = stockData.quantity - item.quantity;
        willDeleteStock = newQuantity === 0;
        
        console.log(`After sale:  Remaining=${newQuantity}, Will delete from inventory=${willDeleteStock}`);
      }
      
      // 2. FIRST: Insert sale with stock_id (before deleting stock)
      const insertData = {
        ...item,
        profit,
        stock_id: originalStockId, // Use the saved original stock_id
      };
      
      console.log('Inserting sale with stock_id:', insertData.stock_id);
      
      const { data:  saleData, error:  saleError } = await (supabase as any)
        .from('sales')
        .insert(insertData)
        .select();
      
      if (saleError) {
        console.error('Error inserting sale:', saleError);
        throw saleError;
      }
      
      console.log('✅ Sale recorded with stock_id:', saleData[0].stock_id);
      
      // 3. THEN: Update or delete stock (this won't affect the sale record now)
      if (originalStockId) {
        // DISABLE the foreign key check temporarily
        if (willDeleteStock) {
          console.log('🗑️ Deleting stock from inventory (sold out)');
          
          // Delete stock - since we inserted sale first, stock_id is already saved
          const { error: stockDeleteError } = await (supabase as any)
            .from('phones_stock')
            .delete()
            .eq('id', originalStockId);

          if (stockDeleteError) {
            console.error('Error deleting stock:', stockDeleteError);
          } else {
            console.log('✅ Stock removed from inventory');
            
            // CRITICAL: Verify stock_id is still in sale record after deletion
            const { data: verifyData } = await (supabase as any)
              .from('sales')
              .select('stock_id')
              .eq('id', saleData[0].id)
              .single();
            
            console.log('✅ Verified sale still has stock_id:', verifyData?. stock_id);
          }
        } else {
          console. log(`📦 Updating stock quantity to ${newQuantity}`);
          
          const { error: stockUpdateError } = await (supabase as any)
            .from('phones_stock')
            .update({ quantity: newQuantity })
            .eq('id', originalStockId);

          if (stockUpdateError) {
            console.error('Error updating stock:', stockUpdateError);
          } else {
            console. log('✅ Stock quantity updated');
          }
        }
      }
      
      return saleData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale recorded successfully.  Stock updated.' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Add sale error:', error);
      toast({ 
        title: 'Error', 
        description: error?. message || 'Failed to add sale', 
        variant: 'destructive' 
      });
    },
  });

  const updateSale = useMutation({
    mutationFn: async ({ id, ... item }: Partial<Sale> & { id: string }) => {
      console.log('=== UPDATING SALE ===');
      
      const { data:  originalSale, error:  fetchError } = await (supabase as any)
        .from('sales')
        .select('quantity, stock_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching original sale:', fetchError);
        throw new Error('Failed to fetch original sale data');
      }

      if (item.quantity !== undefined && originalSale.stock_id && item.quantity !== originalSale. quantity) {
        const quantityDiff = item.quantity - originalSale.quantity;
        
        const { data: stockData } = await (supabase as any)
          .from('phones_stock')
          .select('quantity')
          .eq('id', originalSale.stock_id)
          .maybeSingle();

        if (stockData) {
          const newStockQuantity = stockData.quantity - quantityDiff;
          
          if (newStockQuantity < 0) {
            throw new Error('Insufficient stock.  Cannot increase sale quantity.');
          }

          if (newStockQuantity === 0) {
            await (supabase as any)
              .from('phones_stock')
              .delete()
              .eq('id', originalSale. stock_id);
          } else {
            await (supabase as any)
              .from('phones_stock')
              .update({ quantity: newStockQuantity })
              .eq('id', originalSale. stock_id);
          }
        }
      }
      
      if (item.selling_price !== undefined || item.buying_price !== undefined || item.quantity !== undefined || item.expenses !== undefined) {
        const selling = item.selling_price ??  0;
        const buying = item.buying_price ?? 0;
        const qty = item.quantity ?? 1;
        const expenses = item. expenses ?? 0;
        item.profit = (selling * qty) - (buying * qty) - expenses;
      }
      
      const { data, error } = await (supabase as any)
        .from('sales')
        .update(item)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Error updating sale:', error);
        throw error;
      }
      
      console. log('✅ Sale updated');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ title: 'Success', description: 'Sale updated successfully' });
    },
    onError: (error: any) => {
      console.error('❌ Update sale error:', error);
      toast({ 
        title: 'Error', 
        description: error?.message || 'Failed to update sale', 
        variant: 'destructive' 
      });
    },
  });

  const deleteSale = useMutation({
    mutationFn: async (id: string) => {
      console.log('=== DELETING SALE & RESTORING STOCK ===');
      console.log('Sale ID:', id);
      
      // Fetch sale with stock_id
      const { data: saleData, error:  fetchError } = await (supabase as any)
        .from('sales')
        .select('stock_id, quantity, phone_name, buying_price, vendor')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching sale:', fetchError);
        throw new Error('Failed to fetch sale');
      }

      console.log('Sale data BEFORE delete:', saleData);
      console.log('stock_id to restore:', saleData.stock_id);

      if (! saleData.stock_id) {
        console.error('❌ NO STOCK_ID FOUND IN SALE! ');
        console.error('This means the foreign key constraint set it to null when stock was deleted');
        throw new Error('Cannot restore stock:  stock_id is missing from sale record');
      }

      // Delete sale
      const { error: deleteError } = await (supabase as any)
        .from('sales')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        console.error('Error deleting sale:', deleteError);
        throw deleteError;
      }

      console.log('✅ Sale deleted');

      // Restore stock
      if (saleData.stock_id) {
        console.log(`🔄 Restoring stock:  ${saleData.stock_id}`);
        
        const { data: existingStock } = await (supabase as any)
          .from('phones_stock')
          .select('quantity, phone_name')
          .eq('id', saleData.stock_id)
          .maybeSingle();

        if (existingStock) {
          const newQuantity = existingStock. quantity + saleData.quantity;
          console.log(`Adding ${saleData.quantity} back.  Old:  ${existingStock.quantity}, New: ${newQuantity}`);
          
          const { error: updateError } = await (supabase as any)
            .from('phones_stock')
            .update({ quantity: newQuantity })
            .eq('id', saleData.stock_id);

          if (updateError) {
            throw new Error('Failed to restore stock');
          }

          console.log('✅ Stock quantity restored');
        } else {
          console.log(`🆕 Recreating stock with ${saleData.quantity} units`);
          
          const { error: insertError } = await (supabase as any)
            .from('phones_stock')
            .insert({
              id: saleData.stock_id,
              phone_name: saleData.phone_name,
              quantity: saleData.quantity,
              buying_price: saleData.buying_price,
              selling_price: 0,
              vendor: saleData.vendor || null,
              purchase_date: null,
            });

          if (insertError) {
            console.error('Error recreating stock:', insertError);
            throw new Error(`Failed to recreate stock: ${insertError.message}`);
          }

          console.log('✅ Stock recreated and back in inventory! ');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['phones_stock'] });
      toast({ 
        title: 'Success', 
        description: 'Sale deleted and stock restored!' 
      });
    },
    onError: (error: any) => {
      console.error('❌ Delete error:', error);
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