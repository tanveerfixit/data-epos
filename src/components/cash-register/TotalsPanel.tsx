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
    <div className="p-4 border-b border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black font-mono text-base">
      <div className="flex items-center gap-2 mb-3">
        <Calculator size={16} className="text-neutral-600 dark:text-neutral-400" />
        <h3 className="font-bold text-black dark:text-white text-base uppercase">Summary</h3>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-base">
          <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">€{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-neutral-600 dark:text-neutral-400">Tax (0%)</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">€{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-base">
          <span className="text-neutral-600 dark:text-neutral-400">Discount</span>
          <span className="font-mono font-bold text-neutral-900 dark:text-neutral-100">-€{discount.toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-neutral-300 dark:border-neutral-800 flex justify-between items-end">
          <span className="font-bold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[13px]">Total Amount</span>
          <span className="font-mono text-2xl font-bold text-neutral-900 dark:text-neutral-100 leading-none">€{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};
