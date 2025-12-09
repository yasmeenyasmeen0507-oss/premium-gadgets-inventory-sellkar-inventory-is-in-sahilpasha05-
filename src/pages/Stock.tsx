import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStock, PhoneStock, VENDORS } from '@/hooks/useStock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Package, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Stock() {
  const { stock, isLoading, addStock, updateStock, deleteStock, totalStockValue } = useStock();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<PhoneStock | null>(null);
  const [formData, setFormData] = useState({
    phone_name: '',
    quantity: '',
    buying_price: '',
    vendor: '',
    purchase_date:  new Date().toISOString().split('T')[0],
  });

  // Filter states
  const [filterVendor, setFilterVendor] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered stock
  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const vendorMatch = filterVendor === 'all' || item.vendor === filterVendor;
      const dateFromMatch = !filterDateFrom || ! item.purchase_date || new Date(item.purchase_date) >= new Date(filterDateFrom);
      const dateToMatch = !filterDateTo || ! item.purchase_date || new Date(item.purchase_date) <= new Date(filterDateTo);
      return vendorMatch && dateFromMatch && dateToMatch;
    });
  }, [stock, filterVendor, filterDateFrom, filterDateTo]);

  const resetForm = () => {
    setFormData({
      phone_name: '',
      quantity: '',
      buying_price: '',
      vendor: '',
      purchase_date: new Date().toISOString().split('T')[0],
    });
    setEditItem(null);
  };

  const resetFilters = () => {
    setFilterVendor('all');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (item: PhoneStock) => {
    setEditItem(item);
    setFormData({
      phone_name: item. phone_name,
      quantity:  item.quantity.toString(),
      buying_price: item.buying_price.toString(),
      vendor: item.vendor || '',
      purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate vendor is selected
    if (!formData.vendor) {
      toast({
        title:  'Error',
        description: 'Please select a vendor',
        variant: 'destructive',
      });
      return;
    }

    const data = {
      phone_name: formData.phone_name,
      quantity: parseInt(formData.quantity) || 0,
      buying_price: parseFloat(formData.buying_price) || 0,
      vendor: formData.vendor,
      purchase_date: formData.purchase_date,
    };

    console.log('Form data being submitted:', data);

    if (editItem) {
      updateStock. mutate({ id: editItem. id, ...data });
    } else {
      addStock.mutate(data);
    }
    handleOpenChange(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteStock. mutate(id);
    }
  };

  const activeFiltersCount = (filterVendor !== 'all' ?  1 : 0) + 
                             (filterDateFrom ? 1 : 0) + 
                             (filterDateTo ? 1 : 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
            <p className="text-muted-foreground mt-1">Manage your phone inventory</p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Phone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Phone' : 'Add New Phone'}</DialogTitle>
                <DialogDescription>
                  {editItem ? 'Update the details of the phone in stock.' : 'Add a new phone to your inventory.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_name">Phone Name</Label>
                  <Input
                    id="phone_name"
                    value={formData.phone_name}
                    onChange={(e) => setFormData({ ...formData, phone_name: e.target.value })}
                    placeholder="e.g., iPhone 15 Pro"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buying_price">Buying Price (₹)</Label>
                    <Input
                      id="buying_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.buying_price}
                      onChange={(e) => setFormData({ ...formData, buying_price: e.target. value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select
                    value={formData.vendor}
                    onValueChange={(value) => setFormData({ ... formData, vendor: value })}
                    required
                  >
                    <SelectTrigger id="vendor">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {VENDORS.map((vendor) => (
                        <SelectItem key={vendor} value={vendor}>
                          {vendor}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchase_date">Purchase Date</Label>
                  <Input
                    id="purchase_date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ... formData, purchase_date: e.target.value })}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gradient-primary">
                  {editItem ? 'Update Phone' :  'Add Phone'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Stock Value</p>
                <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredStock.length} of {stock.length} items shown
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

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
                  {showFilters ? 'Hide' : 'Show'} Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          {showFilters && (
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
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

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : filteredStock.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                {stock.length === 0 
                  ? 'No stock items yet.  Add your first phone!' 
                  : 'No items match your filters.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Name</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Purchase Date</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item. phone_name}</TableCell>
                        <TableCell>
                          {item.vendor ?  (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {item.vendor}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.purchase_date ?  format(new Date(item.purchase_date), 'MMM dd, yyyy') : '-'}
                        </TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.buying_price)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.quantity * item.buying_price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDelete(item.id)}
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