import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useReceivables, Receivable } from '@/hooks/useReceivables';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Receivables() {
  const { receivables, isLoading, addReceivable, updateReceivable, deleteReceivable, totalReceivables } = useReceivables();
  const [isOpen, setIsOpen] = useState(false);
  const [editItem, setEditItem] = useState<Receivable | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    amount: '',
  });

  const resetForm = () => {
    setFormData({ customer_name: '', amount: '' });
    setEditItem(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) resetForm();
  };

  const handleEdit = (item: Receivable) => {
    setEditItem(item);
    setFormData({
      customer_name: item.customer_name,
      amount: item.amount.toString(),
    });
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      customer_name: formData.customer_name,
      amount: parseFloat(formData.amount) || 0,
    };

    if (editItem) {
      updateReceivable.mutate({ id: editItem.id, ...data });
    } else {
      addReceivable.mutate(data);
    }
    handleOpenChange(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this receivable?')) {
      deleteReceivable.mutate(id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Balance to Receive</h1>
            <p className="text-muted-foreground mt-1">Track customer receivables</p>
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add Receivable
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit Receivable' : 'Add New Receivable'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="Customer name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (₹)</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
                <Button type="submit" className="w-full gradient-primary">
                  {editItem ? 'Update Receivable' : 'Add Receivable'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-warning flex items-center justify-center">
                <Users className="w-6 h-6 text-warning-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-2xl font-bold">{formatCurrency(totalReceivables)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Receivables Table */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Balances</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : receivables.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No receivables yet. Add your first entry!
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead className="text-right">Amount to Receive</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receivables.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.customer_name}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(item.amount))}
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