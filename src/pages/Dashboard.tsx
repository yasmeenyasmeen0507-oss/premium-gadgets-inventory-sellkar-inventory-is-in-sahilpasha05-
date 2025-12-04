import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { useStock } from '@/hooks/useStock';
import { useReceivables } from '@/hooks/useReceivables';
import { useAccounts } from '@/hooks/useAccounts';
import { useExpenses } from '@/hooks/useExpenses';
import { 
  Package, 
  Wallet, 
  Users, 
  Receipt, 
  TrendingUp,
  Smartphone 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function Dashboard() {
  const { stock, totalStockValue } = useStock();
  const { totalReceivables } = useReceivables();
  const { totalAccountBalance } = useAccounts();
  const { totalExpenses } = useExpenses();

  // Total Money Available = Account Balances + Receivables - Expenses
  const totalMoneyAvailable = totalAccountBalance + totalReceivables - totalExpenses;
  const totalItems = stock.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your stock management system
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <StatCard
            title="Total Stock Value"
            value={formatCurrency(totalStockValue)}
            icon={Package}
            iconClassName="gradient-primary"
          />
          <StatCard
            title="Total Money Available"
            value={formatCurrency(totalMoneyAvailable)}
            icon={TrendingUp}
            iconClassName="bg-success"
          />
          <StatCard
            title="Total Receivables"
            value={formatCurrency(totalReceivables)}
            icon={Users}
            iconClassName="bg-warning"
          />
          <StatCard
            title="Total Expenses"
            value={formatCurrency(totalExpenses)}
            icon={Receipt}
            iconClassName="bg-destructive"
          />
          <StatCard
            title="Account Balances"
            value={formatCurrency(totalAccountBalance)}
            icon={Wallet}
            iconClassName="bg-accent"
          />
          <StatCard
            title="Total Items in Stock"
            value={totalItems.toLocaleString()}
            icon={Smartphone}
          />
        </div>

        {/* Recent Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Stock</CardTitle>
          </CardHeader>
          <CardContent>
            {stock.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No stock items yet. Add your first phone!
              </p>
            ) : (
              <div className="space-y-3">
                {stock.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Smartphone className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{item.phone_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(item.selling_price)}</p>
                      <p className="text-sm text-muted-foreground">
                        Value: {formatCurrency(item.quantity * item.selling_price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}