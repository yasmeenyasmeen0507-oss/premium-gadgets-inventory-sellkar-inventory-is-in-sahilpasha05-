import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useStock, PhoneStock } from '@/hooks/useStock';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
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
import { Plus, Pencil, Trash2, Package } from 'lucide-react';

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
    selling_price: '',
  });

  const resetForm = () => {
    setFormData({ phone_name: '', quantity: '', buying_price: '', selling_price: '' });
    setEditItem(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (item: PhoneStock) => {
    setEditItem(item);
    setFormData({
      phone_name: item.phone_name,
      quantity: item.quantity.toString(),
      buying_price: item.buying_price.toString(),
      selling_price: item.selling_price.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      phone_name: formData.phone_name,
      quantity: parseInt(formData.quantity) || 0,
      buying_price: parseFloat(formData.buying_price) || 0,
      selling_price: parseFloat(formData.selling_price) || 0,
    };

    if (editItem) {
      updateStock.mutate({ id: editItem.id, ...data });
    } else {
      addStock.mutate(data);
    }
    handleOpenChange(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      deleteStock.mutate(id);
    }
  };

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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Phone' : 'Add New Phone'}</DialogTitle>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buying_price">Buying Price (₹)</Label>
                    <Input
                      id="buying_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.buying_price}
                      onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selling_price">Selling Price (₹)</Label>
                    <Input
                      id="selling_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary">
                  {editItem ? 'Update Phone' : 'Add Phone'}
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
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stock Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : stock.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No stock items yet. Add your first phone!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phone Name</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Buy Price</TableHead>
                      <TableHead className="text-right">Sell Price</TableHead>
                      <TableHead className="text-right">Total Value</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.phone_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.buying_price)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.selling_price)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(item.quantity * item.selling_price)}
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