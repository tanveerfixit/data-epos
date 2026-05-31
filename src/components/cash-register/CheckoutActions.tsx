import React from 'react';
import { Check, Trash2, Zap } from 'lucide-react';

interface CheckoutActionsProps {
  onCheckout: () => void;
  onQuickCheckout: () => void;
  onClearCart: () => void;
  isCartEmpty: boolean;
  isPaymentComplete: boolean;
  remainingAmount: number;
  paymentMethod: string;
  addedPaymentsCount: number;
}

export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
  onCheckout,
  onQuickCheckout,
  onClearCart,
  isCartEmpty,
  isPaymentComplete,
  remainingAmount,
  paymentMethod,
  addedPaymentsCount
}) => {
  const getMethodColorClass = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'bg-emerald-600 border-emerald-600 hover:bg-emerald-700 text-white';
      case 'card':
        return 'bg-blue-600 border-blue-600 hover:bg-blue-700 text-white';
      case 'wallet':
        return 'bg-purple-600 border-purple-600 hover:bg-purple-700 text-white';
      default:
        return 'bg-amber-400 border-amber-500 hover:bg-amber-500 text-slate-900';
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {isPaymentComplete ? (
        <button 
          onClick={onCheckout}
          disabled={isCartEmpty}
          className="w-full py-3.5 rounded-none font-bold text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-500 bg-amber-400 text-slate-900 hover:bg-amber-500 disabled:bg-neutral-200 dark:disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:border-neutral-300 dark:disabled:border-neutral-800 disabled:opacity-50 cursor-pointer transition-colors"
        >
          <Check size={18} strokeWidth={3} />
          Complete Checkout
        </button>
      ) : (
        <button 
          onClick={onQuickCheckout}
          disabled={isCartEmpty}
          className={`w-full py-3.5 rounded-none font-bold text-[15px] uppercase tracking-wider flex items-center justify-center gap-2 border cursor-pointer transition-all disabled:bg-neutral-200 dark:disabled:bg-neutral-900 disabled:text-neutral-500 disabled:cursor-not-allowed disabled:border-neutral-300 dark:disabled:border-neutral-800 disabled:opacity-50 ${
            isCartEmpty ? '' : getMethodColorClass(paymentMethod)
          }`}
        >
          <Zap size={18} strokeWidth={3} className="animate-pulse" />
          <span>
            {addedPaymentsCount > 0 
              ? `Pay €${remainingAmount.toFixed(2)} & Finish` 
              : `Quick Checkout (${paymentMethod})`}
          </span>
        </button>
      )}
      
      <button 
        onClick={onClearCart}
        className="w-full py-3 rounded-none font-bold text-base uppercase tracking-wider flex items-center justify-center gap-2 border border-red-600 bg-red-600 hover:bg-red-700 text-white cursor-pointer transition-colors"
      >
        <Trash2 size={16} />
        Discard Transaction
      </button>
    </div>
  );
};

