import React, { useState, useEffect } from 'react';
import { ArrowLeft, Package, History, Plus, Edit3, Trash2, Link, ExternalLink, List, Search } from 'lucide-react';
import { Product, ProductActivity } from '../types';

interface ProductWithStock extends Product {
  stock: {
    branch_id: number;
    branch_name: string;
    quantity: number;
  }[];
}

type Tab = 'info' | 'pricing' | 'activity';

import ProductFormModal from './ProductFormModal';

export default function ProductDetails({ 
  productId, 
  onBack, 
  onAddInventory,
  onViewDevices
}: { 
  productId: number; 
  onBack: () => void;
  onAddInventory: (productId: number) => void;
  onViewDevices: (productId: number) => void;
}) {
  const [product, setProduct] = useState<ProductWithStock | null>(null);
  const [activities, setActivities] = useState<ProductActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [isEditing, setIsEditing] = useState(false);

  const fetchProductData = () => {
    setLoading(true);
    fetch(`/api/products/${productId}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProductData();
  }, [productId]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetch(`/api/products/${productId}/activity`)
        .then(res => res.json())
        .then(setActivities);
    }
  }, [productId, activeTab]);

  const handleUpdate = async (formData: Partial<Product>) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsEditing(false);
        fetchProductData();
      }
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this product?')) return;
    
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        onBack();
      }
    } catch (error) {
      console.error('Error archiving product:', error);
    }
  };

  if (loading && !product) return <div className="p-8 text-center text-slate-500">Loading product details...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found</div>;

  const totalStock = product.stock.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9]">
      {/* Tabs Header */}
      <div className="flex bg-[#e9ecef] border-b border-slate-300 px-4 pt-2 gap-1">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-x transition-colors ${
            activeTab === 'info' 
              ? 'bg-white border-slate-300 text-slate-700 -mb-[1px]' 
              : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-100'
          }`}
        >
          Product Information
        </button>
        <button 
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-x transition-colors ${
            activeTab === 'pricing' 
              ? 'bg-white border-slate-300 text-slate-700 -mb-[1px]' 
              : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-100'
          }`}
        >
          Special Pricing
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-2 text-sm font-medium rounded-t-lg border-t border-x transition-colors ${
            activeTab === 'activity' 
              ? 'bg-white border-slate-300 text-slate-700 -mb-[1px]' 
              : 'bg-slate-200 border-transparent text-slate-500 hover:bg-slate-100'
          }`}
        >
          Activity Log
        </button>
        
        <div className="ml-auto flex items-center pb-2 gap-2">
          <button 
            onClick={handleArchive}
            className="bg-white border border-red-200 hover:bg-red-50 text-red-600 font-medium py-1 px-3 rounded text-xs flex items-center gap-1 transition-all shadow-sm"
          >
            <Trash2 size={14} />
            Archive
          </button>
          <button 
            onClick={onBack}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1 px-3 rounded text-xs flex items-center gap-1 transition-all shadow-sm"
          >
            <List size={14} />
            List Products
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white m-4 border border-slate-300 rounded shadow-sm">
        {activeTab === 'info' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Left: Product Image Placeholder */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-64 h-64 bg-slate-50 border-2 border-slate-200 rounded-lg flex items-center justify-center mb-6">
                  <Link size={120} className="text-slate-900" strokeWidth={3} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button className="bg-[#555] hover:bg-[#444] text-white text-xs font-bold py-2 px-4 rounded transition-colors">
                    Change Picture
                  </button>
                  <button className="bg-[#555] hover:bg-[#444] text-white text-xs font-bold py-2 px-4 rounded transition-colors">
                    Web Description
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-[#555] hover:bg-[#444] text-white text-xs font-bold py-2 px-4 rounded transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Right: Product Details */}
              <div className="flex-1 space-y-4">
                <h1 className="text-2xl font-medium text-[#2980b9] mb-4">{product.product_name}</h1>
                
                <div className="grid grid-cols-[180px_1fr] gap-y-3 text-sm">
                  <span className="font-bold text-slate-700">Category :</span>
                  <span className="text-slate-500">{product.category_name || 'Uncategorized'}</span>
                  
                  <span className="font-bold text-slate-700">Inventory & Tracking Type :</span>
                  <span className="text-slate-500 capitalize">{product.product_type}</span>
                  
                  <span className="font-bold text-slate-700">SKU/Barcode :</span>
                  <span className="text-slate-500 font-mono">{product.sku_code || 'N/A'}</span>
                  
                  <span className="font-bold text-slate-700">Need/Have/OnPO :</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onViewDevices(product.id)}
                      className="text-[#2980b9] font-bold hover:underline"
                    >
                      0 / {totalStock} / 0
                    </button>
                    <button onClick={() => onViewDevices(product.id)}>
                      <Link size={14} className="text-[#2980b9]" />
                    </button>
                    <button 
                      onClick={() => onAddInventory(product.id)}
                      className="bg-[#ffff00] hover:bg-[#e6e600] text-slate-900 font-bold py-1 px-3 rounded text-xs transition-colors shadow-sm"
                    >
                      Add Inventory
                    </button>
                  </div>
                  
                  <span className="font-bold text-slate-700">Minimum Stock :</span>
                  <span className="text-slate-500">0</span>
                  
                  <span className="font-bold text-slate-700">Selling Price :</span>
                  <span className="text-slate-500 font-bold">€{product.selling_price.toFixed(2)}</span>
                  
                  <span className="font-bold text-slate-700">Minimum Selling Price :</span>
                  <span className="text-slate-500 font-bold">€0.00</span>
                  
                  <span className="font-bold text-slate-700">Taxable :</span>
                  <span className="text-slate-500">Yes</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditing && (
          <ProductFormModal 
            onClose={() => setIsEditing(false)}
            onSave={handleUpdate}
            initialData={product}
          />
        )}

        {activeTab === 'activity' && (
          <div className="flex flex-col h-full">
            {/* Activity Log Header */}
            <div className="p-3 bg-[#e9ecef] border-b border-slate-300 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-700">Activity Log</h3>
              <div className="flex gap-2">
                <select className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#3498db]">
                  <option>All Activities</option>
                </select>
                <button className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1 px-3 rounded text-xs transition-all shadow-sm">
                  Add New Note
                </button>
              </div>
            </div>

            {/* Activity Log Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f8f9fa] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <th className="px-4 py-2 border-r border-slate-300 w-24">Date</th>
                    <th className="px-4 py-2 border-r border-slate-300 w-24">Time</th>
                    <th className="px-4 py-2 border-r border-slate-300 w-48">User</th>
                    <th className="px-4 py-2 border-r border-slate-300 w-64">Activity</th>
                    <th className="px-4 py-2">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic text-sm">
                        No activities recorded for this product
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity, idx) => (
                      <tr 
                        key={activity.id} 
                        className={`border-b border-slate-200 text-xs hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-[#f8f9fa]' : ''}`}
                      >
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600">
                          {new Date(activity.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                        </td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600">
                          {new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                        </td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600">{activity.user_name || 'System'}</td>
                        <td className="px-4 py-2 border-r border-slate-200 text-slate-700 font-medium">{activity.activity}</td>
                        <td className="px-4 py-2 text-slate-600">{activity.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Activity Log Footer */}
            <div className="p-2 bg-[#f8f9fa] border-t border-slate-300 flex justify-between items-center text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <select className="bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none">
                  <option>20</option>
                </select>
                <span className="font-bold">1-{activities.length}/{activities.length}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-50">«</button>
                <button className="px-2 py-0.5 bg-[#3498db] text-white rounded font-bold">1</button>
                <button className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-50">»</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="p-8 text-center text-slate-400 italic">
            Special pricing configurations will appear here.
          </div>
        )}
      </div>
    </div>
  );
}
