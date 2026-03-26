import React from 'react';
import { User, UserPlus, Search, X, Plus } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  customerSearch: string;
  setCustomerSearch: (query: string) => void;
  customerResults: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
  onOpenNewCustomerModal: () => void;
}

export const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  selectedCustomer,
  customerSearch,
  setCustomerSearch,
  customerResults,
  onSelectCustomer,
  onClearCustomer,
  onOpenNewCustomerModal
}) => {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-4">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <User size={18} className="text-slate-500" />
          <h3 className="font-bold text-slate-800 text-sm">Customer</h3>
        </div>
        {!selectedCustomer && (
          <button 
            onClick={onOpenNewCustomerModal}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 uppercase tracking-wider"
          >
            <UserPlus size={12} />
            New
          </button>
        )}
      </div>

      {selectedCustomer ? (
        <div className="bg-blue-50 border border-blue-100 rounded-md p-3 flex justify-between items-center animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {selectedCustomer.first_name?.[0] || selectedCustomer.name?.[0] || '?'}
            </div>
            <div>
              <p className="font-bold text-blue-900 text-sm">
                {selectedCustomer.first_name ? `${selectedCustomer.first_name} ${selectedCustomer.last_name}` : selectedCustomer.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-blue-600 font-medium">{selectedCustomer.phone}</p>
                {selectedCustomer.wallet_balance !== undefined && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                    Wallet: €{selectedCustomer.wallet_balance.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedCustomer.name !== 'Walk-in Customer' && (
              <button 
                onClick={() => {
                  const amount = prompt('Enter deposit amount:');
                  if (amount && !isNaN(parseFloat(amount))) {
                    fetch(`/api/customers/${selectedCustomer.id}/payments`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ amount: parseFloat(amount), method: 'Cash', note: 'Manual Deposit' })
                    }).then(res => res.json()).then(data => {
                      if (data.success) {
                        alert('Deposit successful');
                        window.location.reload(); // Simple refresh to update balance
                      }
                    });
                  }
                }}
                className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all"
                title="Deposit to Wallet"
              >
                <Plus size={16} />
              </button>
            )}
            <button 
              onClick={onClearCustomer}
              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-slate-400" />
          </div>
          <input 
            type="text"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            placeholder="Search customer by phone or name..."
            value={customerSearch}
            onChange={(e) => setCustomerSearch(e.target.value)}
          />
          
          {customerSearch && customerResults.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-1 bg-white rounded-md shadow-xl border border-slate-200 max-h-[200px] overflow-y-auto">
              {customerResults.map(customer => (
                <button
                  key={customer.id}
                  onClick={() => onSelectCustomer(customer)}
                  className="w-full text-left p-3 hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 text-xs font-bold">
                    {customer.first_name?.[0] || customer.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      {customer.first_name ? `${customer.first_name} ${customer.last_name}` : customer.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{customer.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
