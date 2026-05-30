import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, List, Link } from 'lucide-react';
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

  if (loading && !product) return (
    <div className="flex items-center justify-center h-full bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-mono p-8 text-lg">
      *** LOADING SYSTEM DATA ***
    </div>
  );
  
  if (!product) return (
    <div className="flex items-center justify-center h-full bg-neutral-100 dark:bg-neutral-955 text-red-500 font-mono p-8 text-lg">
      *** PRODUCT NOT FOUND ***
    </div>
  );

  const totalStock = Array.isArray(product.stock) ? product.stock.reduce((acc, s) => acc + s.quantity, 0) : 0;

  return (
    <div className="flex flex-col h-full bg-neutral-100 text-neutral-900 dark:bg-neutral-955 dark:text-neutral-100 font-mono text-base px-2 py-2 select-none w-full overflow-auto" style={{ fontSize: '17px' }}>
      {/* Tabs Header */}
      <div className="flex bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 px-4 pt-2 gap-1 rounded-none shadow-none mb-2 flex-wrap md:flex-nowrap">
        <button 
          onClick={() => setActiveTab('info')}
          className={`px-4 py-1.5 border border-neutral-300 dark:border-neutral-800 border-b-0 text-base font-bold -mb-px relative transition-colors rounded-none ${
            activeTab === 'info' 
              ? 'bg-neutral-200 dark:bg-neutral-900 text-black dark:text-white' 
              : 'bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-950'
          }`}
        >
          Product Information
        </button>
        <button 
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-1.5 border border-neutral-300 dark:border-neutral-800 border-b-0 text-base font-bold -mb-px relative transition-colors rounded-none ${
            activeTab === 'pricing' 
              ? 'bg-neutral-200 dark:bg-neutral-900 text-black dark:text-white' 
              : 'bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-950'
          }`}
        >
          Special Pricing
        </button>
        <button 
          onClick={() => setActiveTab('activity')}
          className={`px-4 py-1.5 border border-neutral-300 dark:border-neutral-800 border-b-0 text-base font-bold -mb-px relative transition-colors rounded-none ${
            activeTab === 'activity' 
              ? 'bg-neutral-200 dark:bg-neutral-900 text-black dark:text-white' 
              : 'bg-white dark:bg-black text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-950'
          }`}
        >
          Activity Log
        </button>
        
        <div className="ml-auto flex items-center pb-2 gap-2">
          <button 
            onClick={handleArchive}
            className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-red-650 dark:text-red-400 font-bold py-1 px-3 rounded-none text-sm flex items-center gap-1 transition-all shadow-none"
          >
            <Trash2 size={14} />
            Archive
          </button>
          <button 
            onClick={onBack}
            className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold py-1 px-3 rounded-none text-sm flex items-center gap-1 transition-all shadow-none"
          >
            <List size={14} />
            List Products
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-none shadow-none p-4">
        {activeTab === 'info' && (
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-12">
              {/* Left: Product Image Placeholder */}
              <div className="w-full md:w-1/3 flex flex-col items-center">
                <div className="w-64 h-64 bg-neutral-200 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-none flex items-center justify-center mb-6 shadow-none">
                  <Link size={120} className="text-neutral-900 dark:text-neutral-100" strokeWidth={3} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm font-normal py-1 px-3 rounded-none transition-colors">
                    Change Picture
                  </button>
                  <button className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm font-normal py-1 px-3 rounded-none transition-colors">
                    Web Description
                  </button>
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-sm font-normal py-1 px-3 rounded-none transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Right: Product Details */}
              <div className="flex-1 space-y-4 font-normal text-neutral-900 dark:text-neutral-100 text-base">
                <h1 className="text-2xl font-bold text-[#2980b9] dark:text-[#2980b9] mb-4">{product.product_name}</h1>
                
                <div className="grid grid-cols-[200px_1fr] gap-y-3 text-base font-normal">
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Category :</span>
                  <span className="text-neutral-600 dark:text-neutral-400">{product.category_name || 'Uncategorized'}</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Inventory & Tracking Type :</span>
                  <span className="text-neutral-600 dark:text-neutral-400 capitalize">{product.product_type}</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">SKU/Barcode :</span>
                  <span className="text-neutral-600 dark:text-neutral-400 font-mono">{product.sku_code || 'N/A'}</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Need/Have/OnPO :</span>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => onViewDevices(product.id)}
                      className="text-[#2980b9] font-normal hover:underline"
                    >
                      0 / {totalStock} / 0
                    </button>
                    <button onClick={() => onViewDevices(product.id)}>
                      <Link size={14} className="text-[#2980b9]" />
                    </button>
                    <button 
                      onClick={() => onAddInventory(product.id)}
                      className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-1 px-3 rounded-none text-sm transition-colors shadow-none"
                    >
                      Add Inventory
                    </button>
                  </div>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Minimum Stock :</span>
                  <span className="text-neutral-600 dark:text-neutral-400">0</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Selling Price :</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-bold">€{product.selling_price.toFixed(2)}</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Minimum Selling Price :</span>
                  <span className="text-neutral-900 dark:text-neutral-100 font-bold">€0.00</span>
                  
                  <span className="font-normal text-neutral-900 dark:text-neutral-100">Taxable :</span>
                  <span className="text-neutral-600 dark:text-neutral-400">Yes</span>
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
            <div className="p-3 bg-neutral-200 dark:bg-neutral-900 border-b border-neutral-300 dark:border-neutral-800 flex justify-between items-center rounded-none">
              <h3 className="text-base font-bold text-black dark:text-white uppercase">Activity Log</h3>
              <div className="flex gap-2">
                <select className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-none px-2 py-1 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none">
                  <option>All Activities</option>
                </select>
                <button className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold py-1 px-3 rounded-none text-sm transition-all shadow-none">
                  Add New Note
                </button>
              </div>
            </div>

            {/* Activity Log Table */}
            <div className="flex-1 overflow-auto bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-100 dark:bg-neutral-955 border-b border-neutral-300 dark:border-neutral-800 text-[12px] font-bold text-black dark:text-white uppercase tracking-wider">
                    <th className="px-2 py-1 border-r border-neutral-300 dark:border-neutral-800 w-24">Date</th>
                    <th className="px-2 py-1 border-r border-neutral-300 dark:border-neutral-800 w-24">Time</th>
                    <th className="px-2 py-1 border-r border-neutral-300 dark:border-neutral-800 w-48">User</th>
                    <th className="px-2 py-1 border-r border-neutral-300 dark:border-neutral-800 w-64">Activity</th>
                    <th className="px-2 py-1">Details</th>
                  </tr>
                </thead>
                <tbody className="text-sm font-normal">
                  {activities.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-8 text-center text-neutral-400 dark:text-neutral-500 italic text-sm">
                        No activities recorded for this product
                      </td>
                    </tr>
                  ) : (
                    activities.map((activity, idx) => (
                      <tr 
                        key={activity.id} 
                        className={`border-b border-neutral-200 dark:border-neutral-800 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors bg-white dark:bg-black text-neutral-900 dark:text-neutral-100`}
                      >
                        <td className="px-2 py-1 border-r border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {new Date(activity.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}
                        </td>
                        <td className="px-2 py-1 border-r border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">
                          {new Date(activity.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()}
                        </td>
                        <td className="px-2 py-1 border-r border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400">{activity.user_name || 'System'}</td>
                        <td className="px-2 py-1 border-r border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 font-normal">{activity.activity}</td>
                        <td className="px-2 py-1 text-neutral-600 dark:text-neutral-400">{activity.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Activity Log Footer */}
            <div className="p-2 bg-white dark:bg-black border-t border-neutral-300 dark:border-neutral-800 flex justify-between items-center text-[12px] text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-2">
                <select className="bg-white dark:bg-black border border-neutral-300 dark:border-neutral-800 rounded-none px-1 py-0.5 focus:outline-none">
                  <option>20</option>
                </select>
                <span className="font-bold">1-{activities.length}/{activities.length}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <button className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 rounded-none hover:bg-neutral-200 dark:hover:bg-neutral-900">«</button>
                <button className="px-2 py-0.5 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-none font-bold">1</button>
                <button className="px-1.5 py-0.5 border border-neutral-300 dark:border-neutral-800 rounded-none hover:bg-neutral-200 dark:hover:bg-neutral-900">»</button>
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
