import React from 'react';
import { CheckCircle2, Printer, X, ShoppingBag } from 'lucide-react';
import { Invoice } from '../../types';

interface CheckoutModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onPrint: (type: 'Thermal' | 'A4') => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  invoice,
  onClose,
  onPrint
}) => {
  if (!invoice) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="bg-emerald-600 p-8 text-center text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
            <CheckCircle2 size={48} className="text-white" />
          </div>
          <h2 className="text-3xl font-black mb-1">SALE COMPLETE!</h2>
          <p className="text-emerald-100 font-medium">Invoice #{invoice.invoice_number}</p>
        </div>
        
        <div className="p-8">
          <div className="bg-slate-50 rounded-md p-6 mb-8 border border-slate-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Grand Total</span>
              <span className="text-2xl font-black text-slate-800 font-mono">€{invoice.grand_total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Paid Amount</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">€{(invoice.paid_amount || 0).toFixed(2)}</span>
            </div>
            {invoice.due_amount > 0 && (
              <div className="flex justify-between items-center mb-4 p-2 bg-orange-50 rounded border border-orange-100">
                <span className="text-orange-600 font-bold text-xs uppercase tracking-widest">Due Amount</span>
                <span className="text-2xl font-black text-orange-600 font-mono">€{invoice.due_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="space-y-2 border-t border-slate-200 pt-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Payment Details</p>
              {invoice.payments?.map((p, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">{p.method}</span>
                  <span className="font-mono font-bold text-slate-700">€{p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onPrint('Thermal')}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Printer size={24} />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-blue-700">Thermal Receipt</span>
            </button>
            <button 
              onClick={() => onPrint('A4')}
              className="flex flex-col items-center justify-center gap-3 p-6 rounded-md border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Printer size={24} />
              </div>
              <span className="font-bold text-slate-700 group-hover:text-blue-700">A4 Invoice</span>
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full mt-8 py-4 bg-slate-900 text-white rounded-md font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
          >
            <ShoppingBag size={20} />
            New Transaction
          </button>
        </div>
      </div>
    </div>
  );
};
