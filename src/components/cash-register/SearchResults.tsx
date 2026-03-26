import React from 'react';
import { Package, Plus } from 'lucide-react';
import { Product } from '../../types';

interface SearchResultsProps {
  results: Product[];
  onAddProduct: (product: Product) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  onAddProduct
}) => {
  if (results.length === 0) return null;

  return (
    <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-slate-200 max-h-[400px] overflow-y-auto">
      <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase px-2">Search Results ({results.length})</span>
      </div>
      <div className="divide-y divide-slate-100">
        {results.map((product) => (
          <button
            key={product.id}
            onClick={() => onAddProduct(product)}
            className="w-full text-left p-4 hover:bg-blue-50 transition-colors flex justify-between items-center group"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Package size={20} />
              </div>
              <div>
                <p className="font-bold text-slate-800 group-hover:text-blue-700">{product.product_name}</p>
                <div className="flex gap-3 mt-0.5">
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">
                    SKU: {product.sku_code || 'N/A'}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter">
                    Stock: {product.total_stock || 0}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-bold text-slate-900">€{product.selling_price.toFixed(2)}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold">{product.product_type}</p>
              </div>
              <div className="bg-blue-600 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg shadow-blue-200">
                <Plus size={18} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
