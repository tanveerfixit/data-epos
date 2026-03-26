import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Wrench, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    activeRepairs: 0,
    totalCustomers: 0,
    lowStock: 0
  });

  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoices, repairs, customers, products] = await Promise.all([
          fetch('/api/invoices').then(res => res.json()),
          fetch('/api/repairs').then(res => res.json()),
          fetch('/api/customers').then(res => res.json()),
          fetch('/api/products').then(res => res.json())
        ]);

        const totalSales = invoices.reduce((sum: number, inv: any) => sum + inv.grand_total, 0);
        const activeRepairs = repairs.filter((r: any) => r.status !== 'collected').length;

        setStats({
          totalSales,
          activeRepairs,
          totalCustomers: customers.length,
          lowStock: 0 // For now
        });

        setRecentSales(invoices.slice(0, 5));
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    { label: 'Total Sales', value: `€${stats.totalSales.toLocaleString()}`, icon: TrendingUp, color: 'bg-[#3498db]', trend: '+12.5%', trendUp: true },
    { label: 'Active Repairs', value: stats.activeRepairs, icon: Wrench, color: 'bg-[#2c3e50]', trend: '+2', trendUp: true },
    { label: 'Total Customers', value: stats.totalCustomers, icon: Users, color: 'bg-[#3498db]', trend: '+5%', trendUp: true },
    { label: 'Low Stock Items', value: stats.lowStock, icon: ShoppingBag, color: 'bg-[#e74c3c]', trend: '-1', trendUp: false },
  ];

  return (
    <div className="p-4 space-y-6 bg-[#f4f7f9] h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium text-slate-700">Dashboard</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 max-w-[1600px]">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-slate-200 shadow-sm space-y-3">
            <div className="flex justify-between items-start">
              <div className={`${card.color} p-1.5 rounded text-white`}>
                <card.icon size={20} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${card.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                {card.trend}
                {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
              <h3 className="text-2xl font-bold text-slate-800">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Recent Activity</h3>
          <div className="space-y-4">
            {recentSales.map(sale => (
              <div key={sale.id} className="flex items-center gap-4 border-b border-slate-50 pb-3 last:border-0">
                <div className="w-1.5 h-1.5 rounded-full bg-[#3498db]"></div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">New Sale Completed</p>
                  <p className="text-[11px] text-slate-500">Invoice #{sale.invoice_number} • {new Date(sale.created_at).toLocaleTimeString()}</p>
                </div>
                <p className="font-bold text-slate-900 text-sm">€{sale.grand_total.toFixed(2)}</p>
              </div>
            ))}
            {recentSales.length === 0 && (
              <p className="text-slate-400 text-center py-8 text-sm italic">No recent activity</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Top Selling Categories</h3>
          <div className="space-y-5">
            {[
              { label: 'Smartphones', value: 65, color: 'bg-[#3498db]' },
              { label: 'Accessories', value: 25, color: 'bg-[#2c3e50]' },
              { label: 'Repairs', value: 10, color: 'bg-[#3498db]' },
            ].map((cat, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-700">{cat.label}</span>
                  <span className="text-slate-400">{cat.value}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color}`} style={{ width: `${cat.value}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
