import React from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { PaymentEntry } from './types';

interface PaymentPanelProps {
  addedPayments: PaymentEntry[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  remainingAmount: number;
  customerBalance?: number;
  availableMethods: string[];
}

export const PaymentPanel: React.FC<PaymentPanelProps> = ({
  addedPayments,
  paymentMethod,
  setPaymentMethod,
  paymentAmount,
  setPaymentAmount,
  onAddPayment,
  onRemovePayment,
  remainingAmount,
  customerBalance = 0,
  availableMethods = ['Cash', 'Card']
}) => {
  const paymentMethods = [...availableMethods];
  if (customerBalance > 0 && !paymentMethods.includes('Wallet')) {
    paymentMethods.push('Wallet');
  }

  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={18} className="text-slate-500" />
        <h3 className="font-bold text-slate-800 text-sm">Payment</h3>
        {customerBalance > 0 && (
          <span className="ml-auto text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            Wallet: €{customerBalance.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {paymentMethods.map(method => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`py-2 px-3 rounded-md text-[10px] font-bold transition-all border ${
                paymentMethod === method 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' 
                  : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {method}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">€</span>
            <input 
              type="number"
              className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
          <button 
            onClick={onAddPayment}
            className="bg-[#2c3e50] text-white p-2.5 rounded-md hover:bg-[#34495e] transition-colors shadow-sm"
          >
            <Plus size={20} />
          </button>
        </div>

        {addedPayments.length > 0 && (
          <div className="space-y-2 pt-2">
            {addedPayments.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-md border border-slate-100 animate-in fade-in slide-in-from-right-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-white px-1.5 py-0.5 rounded shadow-sm text-slate-500 uppercase">{p.method}</span>
                  <span className="font-mono font-bold text-slate-700 text-sm">€{p.amount.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => onRemovePayment(idx)}
                  className="text-slate-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center px-2 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining</span>
              <span className={`font-mono font-bold text-sm ${remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                €{Math.max(0, remainingAmount).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
