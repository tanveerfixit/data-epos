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
    <div className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={18} className="text-black" />
        <h3 className="font-bold text-black text-sm uppercase tracking-wider">Payment</h3>
        {customerBalance > 0 && (
          <span className="ml-auto text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
            Wallet: €{customerBalance.toFixed(2)}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Simplified Payment Method Buttons */}
        <div className="flex gap-2 w-full">
          {paymentMethods.map((method) => (
            <button
              key={method}
              onClick={() => setPaymentMethod(method)}
              className={`
                flex-1 py-2.5 px-4 text-[15px] font-semibold rounded cursor-pointer transition-colors text-center border
                ${paymentMethod === method 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-black border-gray-300 hover:bg-gray-100'}
              `}
            >
              {method}
            </button>
          ))}
        </div>

        {/* Amount Input and Action Button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">€</span>
            <input 
              type="number"
              className="w-full pl-7 pr-4 py-2.5 bg-white border border-gray-300 rounded text-[16px] font-mono font-bold focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-black placeholder:text-gray-400"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onAddPayment();
                }
              }}
            />
          </div>
          <button 
            onClick={onAddPayment}
            className="bg-emerald-600 text-white px-5 rounded hover:bg-emerald-700 transition-colors flex items-center justify-center cursor-pointer border-0 text-lg font-bold"
            title="Take Payment"
          >
            <Plus size={22} />
          </button>
        </div>

        {addedPayments.length > 0 && (
          <div className="space-y-2 pt-2">
            {addedPayments.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gray-50 p-2.5 rounded border border-gray-200 text-[15px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold bg-white px-1.5 py-0.5 rounded border border-gray-300 text-gray-700 uppercase text-xs">{p.method}</span>
                  <span className="font-mono font-bold text-black">€{p.amount.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => onRemovePayment(idx)}
                  className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer border-0 bg-transparent"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            <div className="flex justify-between items-center px-2 pt-1 text-[15px]">
              <span className="font-bold text-gray-500 uppercase tracking-wider text-xs">Remaining</span>
              <span className={`font-mono font-bold ${remainingAmount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                €{Math.max(0, remainingAmount).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
