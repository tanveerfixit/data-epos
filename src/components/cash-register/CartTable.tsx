import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { CartRow } from './CartRow';
import { CartItem } from './types';

interface CartTableProps {
  cart: CartItem[];
  onUpdateQuantity: (id: number, delta: number, deviceId?: number) => void;
  onUpdatePrice: (id: number, newPrice: number, deviceId?: number) => void;
  onRemove: (id: number, deviceId?: number) => void;
  onOpenImeiSelector: (product: any) => void;
}

export const CartTable: React.FC<CartTableProps> = ({
  cart,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector
}) => {
  return (
    <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <ShoppingCart size={18} />
          </div>
          <h2 className="font-bold text-slate-800">Current Cart</h2>
        </div>
        <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">
          {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
        </span>
      </div>
      
      <div className="overflow-y-auto flex-1 custom-scrollbar">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-12 text-slate-400">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-slate-200">
              <ShoppingCart size={32} className="opacity-20" />
            </div>
            <p className="font-medium">Your cart is empty</p>
            <p className="text-sm opacity-60">Search for products to add them here</p>
          </div>
        ) : (
          <table className="w-full border-collapse">
            <thead className="sticky top-0 bg-white shadow-sm z-10">
              <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="py-3 pl-4">Product Details</th>
                <th className="py-3 text-right">Price</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-right">Total</th>
                <th className="py-3 pr-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {cart.map((item, idx) => (
                <CartRow 
                  key={`${item.id}-${item.device_id || idx}`}
                  item={item}
                  onUpdateQuantity={onUpdateQuantity}
                  onUpdatePrice={onUpdatePrice}
                  onRemove={onRemove}
                  onOpenImeiSelector={onOpenImeiSelector}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
