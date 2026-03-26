import React from 'react';
import { ShoppingBag, XCircle } from 'lucide-react';

interface CheckoutActionsProps {
  onCheckout: () => void;
  onClearCart: () => void;
  isCartEmpty: boolean;
  isPaymentComplete: boolean;
}

export const CheckoutActions: React.FC<CheckoutActionsProps> = ({
  onCheckout,
  onClearCart,
  isCartEmpty,
  isPaymentComplete
}) => {
  return (
    <div className="space-y-3">
      <button 
        onClick={onCheckout}
        disabled={isCartEmpty || !isPaymentComplete}
        className={`w-full py-4 rounded-md font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
          isCartEmpty || !isPaymentComplete
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-emerald-100'
        }`}
      >
        <ShoppingBag size={24} />
        COMPLETE CHECKOUT
      </button>
      
      <button 
        onClick={onClearCart}
        disabled={isCartEmpty}
        className="w-full py-3 rounded-md font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
      >
        <XCircle size={18} />
        Discard Transaction
      </button>
    </div>
  );
};
