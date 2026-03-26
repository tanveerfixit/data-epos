import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Product, Category, Manufacturer } from '../types';

interface ProductFormModalProps {
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  initialData?: Partial<Product>;
}

export default function ProductFormModal({ onClose, onSave, initialData }: ProductFormModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [formData, setFormData] = useState<Partial<Product>>({
    product_name: '',
    category_id: undefined,
    manufacturer_id: undefined,
    sku_code: '',
    barcode: '',
    selling_price: 0,
    cost_price: 0,
    product_type: 'stock',
    ...initialData
  });

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/manufacturers').then(res => res.json()).then(setManufacturers);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded shadow-2xl w-full max-w-[600px] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#e9ecef] px-4 py-3 flex justify-between items-center border-b border-slate-300">
          <h3 className="text-[#333] font-bold text-lg">Product Information</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Product Name<span className="text-red-500">*</span></label>
              <input
                required
                type="text"
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.product_name}
                onChange={e => setFormData({ ...formData, product_name: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Category</label>
              <select
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.category_id || ''}
                onChange={e => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Manufacturer</label>
              <select
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.manufacturer_id || ''}
                onChange={e => setFormData({ ...formData, manufacturer_id: e.target.value ? parseInt(e.target.value) : undefined })}
              >
                <option value="">Select Manufacturer</option>
                {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">SKU Code</label>
              <input
                type="text"
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.sku_code || ''}
                onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Barcode</label>
              <input
                type="text"
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.barcode || ''}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Selling Price</label>
              <div className="w-2/3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-[#ced4da] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.selling_price}
                  onChange={e => setFormData({ ...formData, selling_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Cost Price</label>
              <div className="w-2/3 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border border-[#ced4da] rounded pl-7 pr-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={formData.cost_price}
                  onChange={e => setFormData({ ...formData, cost_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex items-center">
              <label className="w-1/3 text-sm font-bold text-slate-700">Product Type</label>
              <select
                className="w-2/3 border border-[#ced4da] rounded px-3 py-1.5 text-sm focus:border-[#80bdff] focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                value={formData.product_type}
                onChange={e => setFormData({ ...formData, product_type: e.target.value as any })}
              >
                <option value="stock">Stock</option>
                <option value="serialized">Serialized</option>
                <option value="service">Service</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-2 bg-[#f8f9fa] -mx-8 -mb-8 p-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 bg-[#007bff] hover:bg-[#0069d9] text-white rounded text-sm font-bold transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
