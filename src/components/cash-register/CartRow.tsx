import React from 'react';
import { Minus, Plus, Trash2, Smartphone } from 'lucide-react';
import { CartItem } from './types';

interface CartRowProps {
  item: CartItem;
  onUpdateQuantity: (id: number, delta: number, deviceId?: number) => void;
  onUpdatePrice: (id: number, newPrice: number, deviceId?: number) => void;
  onRemove: (id: number, deviceId?: number) => void;
  onOpenImeiSelector: (product: any) => void;
}

export const CartRow: React.FC<CartRowProps> = ({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
  onOpenImeiSelector
}) => {
  const price = item.customPrice ?? item.selling_price;
  const total = price * item.quantity;

  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="py-4 pl-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:shadow-sm transition-all">
            <Smartphone size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-800 leading-tight">{item.product_name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                {item.sku_code || 'N/A'}
              </span>
              {item.product_type === 'serialized' && (
                <button 
                  onClick={() => onOpenImeiSelector(item)}
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter flex items-center gap-1 transition-colors ${
                    item.imei 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  }`}
                >
                  <Smartphone size={10} />
                  {item.imei || 'Select IMEI'}
                </button>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="py-4 text-right">
        <div className="flex items-center justify-end">
          <span className="text-slate-400 mr-1">€</span>
          <input 
            type="number"
            value={price}
            onChange={(e) => onUpdatePrice(item.id, parseFloat(e.target.value) || 0, item.device_id)}
            onFocus={(e) => e.target.select()}
            className="w-20 text-right font-mono font-bold text-slate-600 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-blue-500 focus:outline-none transition-all"
            step="0.01"
          />
        </div>
      </td>
      <td className="py-4">
        <div className="flex items-center justify-center gap-1">
          <button 
            onClick={() => onUpdateQuantity(item.id, -1, item.device_id)}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
          >
            <Minus size={14} />
          </button>
          <div className="w-10 text-center font-mono font-bold text-slate-800 bg-slate-50 py-1 rounded-md border border-slate-100">
            {item.quantity}
          </div>
          <button 
            onClick={() => onUpdateQuantity(item.id, 1, item.device_id)}
            className="p-1.5 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
          >
            <Plus size={14} />
          </button>
        </div>
      </td>
      <td className="py-4 text-right">
        <span className="font-mono font-bold text-blue-600">€{total.toFixed(2)}</span>
      </td>
      <td className="py-4 pr-4 text-right">
        <button 
          onClick={() => onRemove(item.id, item.device_id)}
          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
        >
          <Trash2 size={18} />
        </button>
      </td>
    </tr>
  );
};
