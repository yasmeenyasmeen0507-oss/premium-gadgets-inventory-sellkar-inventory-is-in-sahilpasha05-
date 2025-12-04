-- Phones Stock Table
CREATE TABLE public.phones_stock (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  buying_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Balances to Receive Table
CREATE TABLE public.balances_to_receive (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Account Balances Table
CREATE TABLE public.account_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_name TEXT NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Expenses Table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (but allow all operations for this simple app)
ALTER TABLE public.phones_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances_to_receive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all tables (simple single-user app)
CREATE POLICY "Allow all operations on phones_stock" ON public.phones_stock FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on balances_to_receive" ON public.balances_to_receive FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on account_balances" ON public.account_balances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_phones_stock_updated_at BEFORE UPDATE ON public.phones_stock FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_balances_to_receive_updated_at BEFORE UPDATE ON public.balances_to_receive FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_account_balances_updated_at BEFORE UPDATE ON public.account_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();