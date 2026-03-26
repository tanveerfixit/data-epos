import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Category, Manufacturer } from '../types';

interface CreateProductProps {
  onCancel: () => void;
  onSave: () => void;
}

export default function CreateProduct({ onCancel, onSave }: CreateProductProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [isAdditionalDetailsOpen, setIsAdditionalDetailsOpen] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    manufacturer_id: '',
    category_id: '',
    selling_price: '',
    cost_price: '',
    sku_code: '',
    tracking_type: 'stock', // 'stock', 'non-inventory', 'bundle'
    has_serial: false,
    is_taxable: true,
    require_note: false,
    min_stock_level: '0',
    allow_overselling: true,
    min_sales_price: '',
    additional_description: '',
    alert_message: ''
  });

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/manufacturers').then(res => res.json()).then(setManufacturers);
  }, []);

  const [showNewCategoryModal, setShowNewCategoryModal] = useState(false);
  const [showNewManufacturerModal, setShowNewManufacturerModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');

  const handleQuickAddCategory = async () => {
    if (!newItemName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName })
      });
      if (res.ok) {
        const newCat = await res.json();
        setCategories([...categories, newCat]);
        setFormData({ ...formData, category_id: newCat.id });
        setShowNewCategoryModal(false);
        setNewItemName('');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleQuickAddManufacturer = async () => {
    if (!newItemName.trim()) return;
    try {
      const res = await fetch('/api/manufacturers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName })
      });
      if (res.ok) {
        const newMan = await res.json();
        setManufacturers([...manufacturers, newMan]);
        setFormData({ ...formData, manufacturer_id: newMan.id });
        setShowNewManufacturerModal(false);
        setNewItemName('');
      }
    } catch (error) {
      console.error('Error adding manufacturer:', error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Determine product type based on tracking selection
    let productType = formData.tracking_type;
    if (formData.tracking_type === 'stock' && formData.has_serial) {
      productType = 'serialized';
    } else if (formData.tracking_type === 'non-inventory') {
      productType = 'service';
    }

    const payload = {
      name: formData.name,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      manufacturer_id: formData.manufacturer_id ? Number(formData.manufacturer_id) : null,
      selling_price: Number(formData.selling_price) || 0,
      cost_price: 0, // Default cost price
      product_type: productType,
      sku_code: formData.sku_code,
      barcode: formData.sku_code || '',
      allow_overselling: formData.allow_overselling
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return true;
      } else {
        const errorData = await response.json();
        alert('Error saving product: ' + (errorData.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to connect to the server');
      return false;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    const success = await handleSubmit(e);
    if (success) {
      onSave();
    }
  };

  const handleSaveAndAddAnother = async () => {
    const success = await handleSubmit();
    if (success) {
      setFormData({
        name: '',
        sku_code: '',
        category_id: '',
        manufacturer_id: '',
        selling_price: '',
        cost_price: '',
        tracking_type: 'stock',
        has_serial: false,
        is_taxable: true,
        require_note: false,
        min_stock_level: '5',
        allow_overselling: false,
        min_sales_price: '',
        additional_description: '',
        alert_message: ''
      });
      alert('Product saved! You can add another one.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9] overflow-auto">
      <div className="max-w-4xl mx-auto w-full p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Create a New Product</h2>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700">Basic Information</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Product Name*</label>
                <input
                  type="text"
                  placeholder="eg., Replace charging port, includes parts and labor"
                  className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Manufacturer / Brand</label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db] bg-white"
                    value={formData.manufacturer_id}
                    onChange={e => setFormData({ ...formData, manufacturer_id: e.target.value })}
                  >
                    <option value="">Select Manufacturer Name</option>
                    {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowNewManufacturerModal(true)}
                    className="text-[#3498db] text-xs hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add New Manufacturer
                  </button>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Category</label>
                  <select
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db] bg-white"
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  >
                    <option value="">Select Category Name</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button 
                    type="button" 
                    onClick={() => setShowNewCategoryModal(true)}
                    className="text-[#3498db] text-xs hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} /> Add New Category
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    value={formData.selling_price}
                    onChange={e => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-500">The price the customer pays</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">SKU/Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g., ZG001AQA"
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    value={formData.sku_code}
                    onChange={e => setFormData({ ...formData, sku_code: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-500">(Optional) A unique code you use to identify this product</p>
                </div>
              </div>
            </div>
          </section>

          {/* Inventory & Tracking */}
          <section className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700">Inventory & Tracking</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">How will you track stock for this item?</p>
              
              <div className="space-y-3">
                {/* Track Stock */}
                <div className={`p-4 border rounded cursor-pointer transition-colors ${formData.tracking_type === 'stock' ? 'bg-blue-50 border-[#3498db]' : 'border-slate-200 hover:bg-slate-50'}`}
                     onClick={() => setFormData({ ...formData, tracking_type: 'stock' })}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="tracking_type"
                      className="mt-1"
                      checked={formData.tracking_type === 'stock'}
                      readOnly
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Track Stock</p>
                      <p className="text-xs text-slate-500">For physical goods like cases, cables, and repair parts where you need to count quantity.</p>
                      
                      {formData.tracking_type === 'stock' && (
                        <div className="mt-3 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            id="has_serial"
                            checked={formData.has_serial}
                            onChange={e => setFormData({ ...formData, has_serial: e.target.checked })}
                          />
                          <label htmlFor="has_serial" className="text-sm font-medium text-slate-700">
                            This item has a Serial Number / IMEI / Unique ID on each piece
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Labor */}
                <div className={`p-4 border rounded cursor-pointer transition-colors ${formData.tracking_type === 'non-inventory' ? 'bg-blue-50 border-[#3498db]' : 'border-slate-200 hover:bg-slate-50'}`}
                     onClick={() => setFormData({ ...formData, tracking_type: 'non-inventory' })}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="tracking_type"
                      className="mt-1"
                      checked={formData.tracking_type === 'non-inventory'}
                      readOnly
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Labor, Fees & Non-Inventory</p>
                      <p className="text-xs text-slate-500">For labor charges, diagnostics, fees, and items where stock levels are not tracked.</p>
                    </div>
                  </div>
                </div>

                {/* Bundles */}
                <div className={`p-4 border rounded cursor-pointer transition-colors ${formData.tracking_type === 'bundle' ? 'bg-blue-50 border-[#3498db]' : 'border-slate-200 hover:bg-slate-50'}`}
                     onClick={() => setFormData({ ...formData, tracking_type: 'bundle' })}>
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="tracking_type"
                      className="mt-1"
                      checked={formData.tracking_type === 'bundle'}
                      readOnly
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Bundles</p>
                      <p className="text-xs text-slate-500">Group multiple existing products or services to sell as a single package or kit.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Product Details */}
          <section className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="font-bold text-slate-700">Product Details</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="is_taxable"
                    className="mt-1"
                    checked={formData.is_taxable}
                    onChange={e => setFormData({ ...formData, is_taxable: e.target.checked })}
                  />
                  <div>
                    <label htmlFor="is_taxable" className="text-sm font-bold text-slate-800">Taxable</label>
                    <p className="text-xs text-slate-500">Check this box to apply your store's tax rate to this item at checkout.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="require_note"
                    className="mt-1"
                    checked={formData.require_note}
                    onChange={e => setFormData({ ...formData, require_note: e.target.checked })}
                  />
                  <div>
                    <label htmlFor="require_note" className="text-sm font-bold text-slate-800">Require to Enter a Reference Note to Sell</label>
                    <p className="text-xs text-slate-500">Requires an employee to enter a specific detail (code, phone number, note, etc.) at the point of sale. Will appear on receipt. Max 20 chars</p>
                  </div>
                </div>
              </div>

              {formData.tracking_type === 'stock' && (
                <>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-slate-800">Minimum Stock Level</label>
                    <input
                      type="number"
                      className="w-48 p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                      value={formData.min_stock_level}
                      onChange={e => setFormData({ ...formData, min_stock_level: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">Set the quantity that will trigger a low stock alert.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="allow_overselling"
                      className="mt-1"
                      checked={formData.allow_overselling}
                      onChange={e => setFormData({ ...formData, allow_overselling: e.target.checked })}
                    />
                    <div>
                      <label htmlFor="allow_overselling" className="text-sm font-bold text-slate-800">Allow Overselling</label>
                      <p className="text-xs text-slate-500">Check this box to allow this item to be sold even when on-hand quantity is zero.</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Additional Details */}
          <section className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
            <button
              type="button"
              className="w-full px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 text-left"
              onClick={() => setIsAdditionalDetailsOpen(!isAdditionalDetailsOpen)}
            >
              {isAdditionalDetailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <h3 className="font-bold text-slate-700">Additional Details</h3>
            </button>
            
            {isAdditionalDetailsOpen && (
              <div className="p-6 space-y-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Minimum Sales Price</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-64 p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    value={formData.min_sales_price}
                    onChange={e => setFormData({ ...formData, min_sales_price: e.target.value })}
                  />
                  <p className="text-xs text-slate-500">Prevents staff from selling bellow this price without override</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Additional Description</label>
                    <textarea
                      rows={3}
                      className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                      value={formData.additional_description}
                      onChange={e => setFormData({ ...formData, additional_description: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-500">This description is for your customers. It will be shown on your receipt (if enabled).</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Alert Message</label>
                    <textarea
                      rows={3}
                      className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                      value={formData.alert_message}
                      onChange={e => setFormData({ ...formData, alert_message: e.target.value })}
                    />
                    <p className="text-[11px] text-slate-500">Add a short message that will pop up for your staff at the Point of Sale every time this item is added to the cart. This is perfect for upsell reminders, warnings, or special handling instructions.</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Footer Buttons */}
          <div className="flex justify-end items-center gap-3 pt-4 pb-12">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 text-slate-600 hover:text-slate-800 font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-medium hover:bg-slate-50"
            >
              Save & Add Another
            </button>
            <button
              type="submit"
              className="px-8 py-2 bg-[#3498db] text-white rounded font-bold hover:bg-[#2980b9] shadow-sm"
            >
              Save Product
            </button>
          </div>
        </form>

        {/* Quick Add Modals */}
        {(showNewCategoryModal || showNewManufacturerModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-slate-800">
                  {showNewCategoryModal ? 'Add New Category' : 'Add New Manufacturer'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    type="text"
                    className="w-full p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#3498db]"
                    placeholder="Enter name..."
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowNewCategoryModal(false);
                    setShowNewManufacturerModal(false);
                    setNewItemName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={showNewCategoryModal ? handleQuickAddCategory : handleQuickAddManufacturer}
                  className="px-4 py-2 text-sm font-medium bg-[#3498db] text-white rounded hover:bg-[#2980b9]"
                >
                  Add Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
