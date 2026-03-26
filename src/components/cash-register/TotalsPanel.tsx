import React from 'react';
import { Calculator } from 'lucide-react';

interface TotalsPanelProps {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
}

export const TotalsPanel: React.FC<TotalsPanelProps> = ({
  subtotal,
  tax,
  discount,
  total
}) => {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200 p-5 space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Calculator size={18} className="text-slate-500" />
        <h3 className="font-bold text-slate-800 text-sm">Summary</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Subtotal</span>
          <span className="font-mono font-bold text-slate-700">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Tax (0%)</span>
          <span className="font-mono font-bold text-slate-700">€{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Discount</span>
          <span className="font-mono font-bold text-emerald-600">-€{discount.toFixed(2)}</span>
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
          <span className="font-bold text-slate-800 uppercase tracking-wider text-xs">Total Amount</span>
          <span className="font-mono text-3xl font-black text-blue-600 leading-none">€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
