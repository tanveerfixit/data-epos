import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Package } from 'lucide-react';
import { Product, Category, Manufacturer } from '../types';

export default function ProductList({ 
  onCreateProduct,
  onSelectProduct
}: { 
  onCreateProduct: () => void;
  onSelectProduct: (id: number) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);

  useEffect(() => {
    fetch('/api/products').then(res => res.json()).then(setProducts);
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/manufacturers').then(res => res.json()).then(setManufacturers);
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-slate-200">
        <h2 className="text-xl font-medium text-slate-700">Manage Products</h2>
        <button 
          onClick={onCreateProduct}
          className="bg-[#f1c40f] hover:bg-[#d4ac0d] text-slate-900 font-bold py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={16} />
          Create Product
        </button>
      </div>

      {/* Filters & Search */}
      <div className="p-4 flex flex-wrap gap-2 items-center bg-white border-b border-slate-200">
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>All Products</option>
        </select>
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>All Manufacturers</option>
          {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="bg-white border border-slate-300 rounded px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#3498db] w-48">
          <option>All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <div className="relative flex-1 max-w-md ml-auto">
          <input
            type="text"
            placeholder="Search Products"
            className="w-full pl-3 pr-10 py-1.5 bg-white border border-slate-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#3498db]"
          />
          <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-slate-100 border-l border-slate-300 rounded-r cursor-pointer hover:bg-slate-200">
            <Search size={16} className="text-slate-600" />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-300 w-1/6">Manufacturer Name</th>
                <th className="px-4 py-2 border-r border-slate-300 w-1/4">Product Name</th>
                <th className="px-4 py-2 border-r border-slate-300 w-1/6">SKU/Barcode</th>
                <th className="px-4 py-2 border-r border-slate-300 w-1/6">Category Name</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right w-1/12">Selling Price</th>
                <th className="px-4 py-2 text-center w-1/6">Stock (Total)</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, idx) => (
                <tr 
                  key={product.id} 
                  onClick={() => onSelectProduct(product.id)}
                  className={`border-b border-slate-200 text-sm hover:bg-blue-50 cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-[#f8f9fa]' : ''}`}
                >
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{product.manufacturer_name || ''}</td>
                  <td className="px-4 py-2 border-r border-slate-200 font-medium text-slate-800">{product.product_name}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-slate-500 font-mono text-xs">{product.sku_code || product.barcode || ''}</td>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">{product.category_name || ''}</span>
                      {product.category_name && (
                        <button className="p-1 bg-slate-600 text-white rounded-sm hover:bg-slate-700">
                          <div className="flex gap-0.5">
                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                          </div>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right font-medium text-slate-900">
                    €{product.selling_price.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <span className={`font-bold text-xs ${product.total_stock && product.total_stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {product.total_stock || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-600">
        <div className="flex items-center gap-4">
          <select className="bg-white border border-slate-300 rounded px-2 py-1 focus:outline-none">
            <option>auto</option>
          </select>
          <span className="font-bold">1-21/2928</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">«</button>
          <button className="px-3 py-1 bg-[#3498db] text-white rounded font-bold">1</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">2</button>
          <span className="px-2">..</span>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">139</button>
          <button className="px-3 py-1 border border-slate-300 rounded hover:bg-slate-50">140</button>
          <button className="px-2 py-1 border border-slate-300 rounded hover:bg-slate-50">»</button>
        </div>
      </div>

    </div>
  );
}

