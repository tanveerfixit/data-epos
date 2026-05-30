import React from 'react';
import { Product } from '../../types';

interface SearchResultsProps {
  results: Product[];
  searchQuery: string;
  onAddProduct: (product: Product) => void;
  onQuickAddClick?: (searchTerm: string) => void;
  activeIndex?: number;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchQuery,
  onAddProduct,
  onQuickAddClick,
  activeIndex = 0
}) => {
  const hasQuery = searchQuery.trim().length >= 2;

  if (results.length === 0) {
    if (!hasQuery || !onQuickAddClick) return null;

    return (
      <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-gray-300 p-4 mt-1 text-sm text-black">
        <div className="text-center">
          <p className="mb-2">No products found matching "{searchQuery}"</p>
          <button
            type="button"
            onClick={() => onQuickAddClick(searchQuery)}
            className="px-3 py-1 bg-black text-white hover:bg-gray-800 text-xs font-normal uppercase transition-colors border-0 cursor-pointer"
          >
            Add "{searchQuery}"
          </button>
        </div>
      </div>
    );
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    
    // Normalize spaces and hyphens to match interchangeably (e.g. "type c" matches "type-c")
    const escaped = highlight
      .trim()
      .replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') // Escape regex chars
      .replace(/\s+/g, '[ -]?');                 // Match spaces, hyphens or nothing between words
      
    try {
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return parts.map((part, i) => 
        regex.test(part) ? (
          <mark 
            key={i} 
            style={{ 
              backgroundColor: '#fef08a', // warm clean yellow
              color: '#000000', 
              fontWeight: 'normal',
              padding: '0 2px',
              borderRadius: '2px'
            }}
          >
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch (e) {
      return text;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 z-[60] bg-white border border-gray-300 mt-1 shadow-md text-[15px] text-black font-sans">
      <div className="max-h-60 overflow-y-auto">
        {results.map((product, idx) => (
          <button
            key={`${product.id}-${idx}`}
            onClick={() => onAddProduct(product)}
            className={`w-full text-left px-4 py-2 hover:bg-gray-200 transition-colors flex items-center justify-between gap-4 border-0 border-b border-gray-100 cursor-pointer text-black font-normal ${
              idx === activeIndex ? 'bg-gray-200' : 'bg-white'
            }`}
          >
            <div className="flex-1 min-w-0 text-[15px] flex items-center gap-2 text-black">
              <span className="font-normal truncate">
                {highlightText(product.product_name, searchQuery)}
              </span>
              <span className="text-gray-400">-</span>
              <span className="text-gray-600 font-mono whitespace-nowrap">
                SKU: {product.sku_code || 'N/A'}
              </span>
              {((product as any).imei || (product as any).serial) && (
                <>
                  <span className="text-gray-400">-</span>
                  <span className="text-gray-600 font-mono whitespace-nowrap">
                    {(product as any).imei || (product as any).serial}
                  </span>
                </>
              )}
              <span className="text-gray-400">-</span>
              <span className="text-gray-600 font-mono whitespace-nowrap">
                Qty: {product.product_type === 'serialized' ? '1' : product.total_stock || 0}
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-gray-50 px-4 py-1.5 border-t border-gray-200 text-xs text-gray-500">
        Press Enter to add first result or click an item
      </div>
    </div>
  );
};
