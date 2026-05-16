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
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchProducts = () => {
    fetch(`/api/products?page=${currentPage}&limit=${itemsPerPage}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.products && Array.isArray(data.products)) {
          setProducts(data.products);
          setTotalItems(data.total || 0);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setTotalItems(data.length);
        } else {
          setProducts([]);
          setTotalItems(0);
        }
      })
      .catch(err => {
        console.error('Error fetching products:', err);
        setProducts([]);
        setTotalItems(0);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    fetch('/api/categories').then(res => res.json()).then(setCategories);
    fetch('/api/manufacturers').then(res => res.json()).then(setManufacturers);
  }, []);

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '..', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '..', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '..', currentPage - 1, currentPage, currentPage + 1, '..', totalPages);
      }
    }
    
    return pages.map((p, i) => (
      <React.Fragment key={i}>
        {p === '..' ? (
          <span className="px-2 text-[var(--text-muted)]">..</span>
        ) : (
          <button
            onClick={() => handlePageChange(Number(p))}
            className={`px-3 py-1 rounded font-bold transition-colors ${
              currentPage === p 
                ? 'bg-[var(--brand-primary)] text-white' 
                : 'border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-app)]'
            }`}
          >
            {p}
          </button>
        )}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] transition-colors duration-300">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-[var(--bg-card)] border-b border-[var(--border-base)]">
        <h2 className="text-xl font-medium text-[var(--text-main)]">Manage Products</h2>
        <button 
          onClick={onCreateProduct}
          className="bg-[var(--brand-warning)] hover:opacity-90 text-slate-900 font-bold py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={16} />
          Create Product
        </button>
      </div>

      <div className="p-4 flex flex-wrap gap-2 items-center bg-[var(--bg-card)] border-b border-[var(--border-base)]">
        <select className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48">
          <option>All Products</option>
        </select>
        <select className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48">
          <option>All Manufacturers</option>
          {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-3 py-1.5 text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] w-48">
          <option>All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        
        <div className="relative flex-1 max-w-md ml-auto">
          <input
            type="text"
            placeholder="Search Products"
            className="w-full pl-3 pr-10 py-1.5 bg-[var(--bg-card)] border border-[var(--border-base)] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)] text-[var(--text-main)]"
          />
          <div className="absolute right-0 top-0 h-full w-10 flex items-center justify-center bg-[var(--bg-app)] border-l border-[var(--border-base)] rounded-r cursor-pointer hover:bg-[var(--bg-hover)]">
            <Search size={16} className="text-[var(--text-muted)]" />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-app)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/6">Manufacturer Name</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/4">Product Name</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/6">SKU/Barcode</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] w-1/6">Category Name</th>
                <th className="px-4 py-2 border-r border-[var(--border-base)] text-right w-1/12">Selling Price</th>
                <th className="px-4 py-2 text-center w-1/6">Stock (Total)</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr 
                    key={product.id} 
                    onClick={() => onSelectProduct(product.id)}
                    className={`border-b border-[var(--border-base)] text-sm hover:bg-[var(--bg-hover)] cursor-pointer transition-colors ${idx % 2 === 1 ? 'bg-[var(--bg-app)]/30' : ''}`}
                  >
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)]">{product.manufacturer_name || ''}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] font-medium text-[var(--text-main)]">{product.product_name}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-[var(--text-muted)] font-mono text-xs">{product.sku_code || product.barcode || ''}</td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)]">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">{product.category_name || ''}</span>
                        {product.category_name && (
                          <button className="p-1 bg-[var(--bg-sidebar)] text-white rounded-sm hover:opacity-90 transition-opacity">
                            <div className="flex gap-0.5">
                              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                              <div className="w-0.5 h-0.5 bg-white rounded-full"></div>
                            </div>
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 border-r border-[var(--border-base)] text-right font-medium text-[var(--text-main)]">
                      €{product.selling_price.toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`font-bold text-xs ${product.total_stock && product.total_stock > 0 ? 'text-[var(--brand-success)]' : 'text-[var(--brand-danger)]'}`}>
                        {product.total_stock || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Pagination */}
      <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-base)] flex justify-between items-center text-xs text-[var(--text-muted)]">
        <div className="flex items-center gap-4">
          <select 
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded px-2 py-1 focus:outline-none text-[var(--text-main)]"
          >
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="font-bold">
            {totalItems > 0 ? `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, totalItems)}/${totalItems}` : '0-0/0'}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-app)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            «
          </button>
          {renderPageNumbers()}
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-2 py-1 border border-[var(--border-base)] rounded hover:bg-[var(--bg-app)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            »
          </button>
        </div>
      </div>


    </div>
  );
}

