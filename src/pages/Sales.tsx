import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useSales, Sale, PAYMENT_STATUS } from '@/hooks/useSales';
import { useStock, VENDORS } from '@/hooks/useStock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, ShoppingCart, TrendingUp, DollarSign, Filter, X, AlertCircle, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Sales() {
  const { sales, isLoading, addSale, updateSale, deleteSale, totalSales, totalProfit, totalCost, totalExpenses } = useSales();
  const { stock } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<Sale | null>(null);
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [formData, setFormData] = useState({
    phone_name: '',
    quantity: '1',
    buying_price:   '',
    selling_price:  '',
    expenses: '0',
    customer_name: '',
    vendor:   '',
    sale_date:  new Date().toISOString().split('T')[0],
    payment_status: 'paid' as 'paid' | 'pending' | 'partial',
    notes: '',
  });

  // Filter states
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Get selected stock details
  const selectedStock = stock.find(s => s.id === selectedStockId);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const statusMatch = filterPaymentStatus === 'all' || sale.payment_status === filterPaymentStatus;
      const vendorMatch = filterVendor === 'all' || sale.vendor === filterVendor;
      const dateFromMatch = !filterDateFrom || new Date(sale.sale_date) >= new Date(filterDateFrom);
      const dateToMatch = ! filterDateTo || new Date(sale.sale_date) <= new Date(filterDateTo);
      return statusMatch && vendorMatch && dateFromMatch && dateToMatch;
    });
  }, [sales, filterPaymentStatus, filterVendor, filterDateFrom, filterDateTo]);

  const resetForm = () => {
    setFormData({
      phone_name:   '',
      quantity: '1',
      buying_price:  '',
      selling_price: '',
      expenses: '0',
      customer_name: '',
      vendor:   '',
      sale_date:  new Date().toISOString().split('T')[0],
      payment_status: 'paid',
      notes: '',
    });
    setSelectedStockId('');
    setEditItem(null);
  };

  const resetFilters = () => {
    setFilterPaymentStatus('all');
    setFilterVendor('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (item: Sale) => {
    setEditItem(item);
    setSelectedStockId(item.stock_id || '');
    setFormData({
      phone_name:   item.phone_name,
      quantity: item.quantity.toString(),
      buying_price: item.buying_price.toString(),
      selling_price: item.selling_price.toString(),
      expenses: item.expenses.toString(),
      customer_name: item.customer_name || '',
      vendor: item.vendor || '',
      sale_date:  item.sale_date,
      payment_status: item.payment_status,
      notes: item. notes || '',
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this sale?  This action cannot be undone.')) {
      deleteSale. mutate(id);
    }
  };

  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    const selected = stock.find(s => s.id === stockId);
    if (selected) {
      setFormData({
        ...formData,
        phone_name: selected.phone_name,
        buying_price: selected.buying_price. toString(),
        vendor: selected.vendor || '',
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const quantity = parseInt(formData.quantity) || 1;
    
    // Check stock availability
    if (selectedStock && quantity > selectedStock.quantity) {
      toast({
        title: 'Insufficient Stock',
        description: `Only ${selectedStock.quantity} units available`,
        variant: 'destructive',
      });
      return;
    }

    const data = {
      stock_id: selectedStockId || null,
      phone_name: formData.phone_name,
      quantity,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData. selling_price) || 0,
      expenses: parseFloat(formData.expenses) || 0,
      customer_name: formData.customer_name || null,
      vendor: formData. vendor || null,
      sale_date: formData.sale_date,
      payment_status: formData.payment_status,
      notes: formData.notes || null,
    };

    if (editItem) {
      updateSale.mutate({ id: editItem.id, ...data });
    } else {
      addSale.mutate(data);
    }
    handleOpenChange(false);
  };

  const activeFiltersCount = (filterPaymentStatus !== 'all' ?  1 : 0) + 
                             (filterVendor !== 'all' ? 1 : 0) +
                             (filterDateFrom ?  1 : 0) + 
                             (filterDateTo ? 1 : 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':  return 'bg-green-500/10 text-green-500';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500';
      case 'partial': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const profitMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : '0';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Management</h1>
            <p className="text-muted-foreground mt-1">Track your phone sales and profits</p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Sale
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Sale' : 'Record New Sale'}</DialogTitle>
                <DialogDescription>
                  {editItem ?  'Update the sale details.' : 'Select a phone from stock and record the sale.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {! editItem && (
                  <div className="space-y-2">
                    <Label htmlFor="stock_select">Select from Stock *</Label>
                    <Select
                      value={selectedStockId}
                      onValueChange={handleStockSelect}
                      required
                    >
                      <SelectTrigger id="stock_select">
                        <SelectValue placeholder="Choose a phone from stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {stock.filter(item => item.quantity > 0).map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.phone_name} - Stock: {item.quantity} - Cost: {formatCurrency(item. buying_price)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedStock && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Available Stock:</strong> {selectedStock. quantity} units · 
                      <strong> Cost Price:</strong> {formatCurrency(selectedStock.buying_price)} · 
                      <strong> Vendor:</strong> {selectedStock.vendor || 'N/A'}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedStock?. quantity || 999}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e. target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customer_name">Customer Name</Label>
                    <Input
                      id="customer_name"
                      value={formData. customer_name}
                      onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="buying_price">Cost Price (₹) *</Label>
                    <Input
                      id="buying_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.buying_price}
                      onChange={(e) => setFormData({ ...formData, buying_price: e.target. value })}
                      required
                      disabled={!! selectedStock}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (₹) *</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target. value })}
                      placeholder="Enter selling price"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expenses">Additional Expenses (₹)</Label>
                    <Input
                      id="expenses"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.expenses}
                      onChange={(e) => setFormData({ ...formData, expenses: e.target.value })}
                      placeholder="Transport, repairs, etc."
                    />
                    <p className="text-xs text-muted-foreground">This will be deducted from profit</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Sale Date *</Label>
                    <Input
                      id="sale_date"
                      type="date"
                      value={formData.sale_date}
                      onChange={(e) => setFormData({ ...formData, sale_date: e. target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_status">Payment Status *</Label>
                    <Select
                      value={formData.payment_status}
                      onValueChange={(value:  any) => setFormData({ ...formData, payment_status: value })}
                      required
                    >
                      <SelectTrigger id="payment_status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status. charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData. notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target. value })}
                      placeholder="Optional notes"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Profit Preview */}
                {formData.buying_price && formData.selling_price && formData.quantity && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium mb-3">Sale Summary: </p>
                    <div className="grid grid-cols-5 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total Cost</p>
                        <p className="font-semibold text-lg">{formatCurrency(parseFloat(formData.buying_price) * parseInt(formData.quantity))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Revenue</p>
                        <p className="font-semibold text-lg text-blue-600">{formatCurrency(parseFloat(formData.selling_price) * parseInt(formData. quantity))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expenses</p>
                        <p className="font-semibold text-lg text-orange-600">{formatCurrency(parseFloat(formData.expenses || '0'))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Net Profit</p>
                        <p className={`font-bold text-lg ${((parseFloat(formData.selling_price) - parseFloat(formData.buying_price)) * parseInt(formData.quantity) - parseFloat(formData.expenses || '0')) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency((parseFloat(formData.selling_price) - parseFloat(formData.buying_price)) * parseInt(formData.quantity) - parseFloat(formData.expenses || '0'))}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Margin</p>
                        <p className={`font-semibold text-lg ${(((parseFloat(formData.selling_price) * parseInt(formData.quantity)) - (parseFloat(formData.buying_price) * parseInt(formData. quantity)) - parseFloat(formData.expenses || '0')) / (parseFloat(formData.selling_price) * parseInt(formData.quantity)) * 100) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(((parseFloat(formData.selling_price) * parseInt(formData.quantity)) - (parseFloat(formData.buying_price) * parseInt(formData.quantity)) - parseFloat(formData.expenses || '0')) / (parseFloat(formData.selling_price) * parseInt(formData.quantity)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full gradient-primary">
                  {editItem ? 'Update Sale' :  'Record Sale'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalSales)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{sales.length} sales</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/20 bg-orange-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Expenses</p>
                  <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalExpenses)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalProfit)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{profitMargin}% margin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-500/20 bg-purple-500/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Filters</CardTitle>
              <div className="flex gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear ({activeFiltersCount})
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-8"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  {showFilters ?  'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md: grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filter-status">Payment Status</Label>
                  <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
                    <SelectTrigger id="filter-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {PAYMENT_STATUS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status. charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-vendor">Vendor</Label>
                  <Select value={filterVendor} onValueChange={setFilterVendor}>
                    <SelectTrigger id="filter-vendor">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {VENDORS.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-date-from">Date From</Label>
                  <Input
                    id="filter-date-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-date-to">Date To</Label>
                  <Input
                    id="filter-date-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Sales Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sales History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading... </p>
            ) : filteredSales.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {sales.length === 0 
                  ? 'No sales yet.  Record your first sale!' 
                  : 'No sales match your filters.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Selling Price</TableHead>
                      <TableHead className="text-right">Expenses</TableHead>
                      <TableHead className="text-right">Net Profit</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales. map((sale) => (
                      <TableRow key={sale. id}>
                        <TableCell className="whitespace-nowrap">{format(new Date(sale.sale_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="font-medium">{sale.phone_name}</TableCell>
                        <TableCell>{sale.customer_name || '-'}</TableCell>
                        <TableCell>
                          {sale.vendor ?  (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {sale.vendor}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right">{sale.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(sale.buying_price)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(sale.selling_price)}</TableCell>
                        <TableCell className="text-right text-orange-600">{formatCurrency(sale.expenses)}</TableCell>
                        <TableCell className={`text-right font-bold ${sale.profit >= 0 ?  'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(sale.profit)}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(sale.payment_status)}`}>
                            {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(sale)}
                              title="Edit sale"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(sale.id)}
                              title="Delete sale"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}