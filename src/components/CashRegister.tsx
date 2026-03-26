import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  XCircle
} from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { Product, Customer, Invoice } from '../types';

// Import refactored components
import { ProductSearchBar } from './cash-register/ProductSearchBar';
import { SearchResults } from './cash-register/SearchResults';
import { CartTable } from './cash-register/CartTable';
import { ActivityLog } from './cash-register/ActivityLog';
import { Sidebar } from './cash-register/Sidebar';
import { CheckoutModal } from './cash-register/CheckoutModal';
import { ImeiSelectorModal } from './cash-register/ImeiSelectorModal';
import CustomerFormModal from './CustomerFormModal';
import { CartItem, PaymentEntry, Activity } from './cash-register/types';
import { useThermalSettings } from '../hooks/useThermalSettings';

interface CashRegisterProps {
  onViewCustomers?: () => void;
  onSelectCustomer?: (id: number) => void;
  preSelectedCustomerId?: number | null;
}

export default function CashRegister({ onViewCustomers, onSelectCustomer, preSelectedCustomerId }: CashRegisterProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['Cash', 'Card']);
  const [addedPayments, setAddedPayments] = useState<PaymentEntry[]>([]);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);
  const [printType, setPrintType] = useState<'Thermal' | 'A4'>('Thermal');
  const [activities, setActivities] = useState<Activity[]>([]);
  
  // New Customer Modal State
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const walkInCustomerRef = useRef<Customer | null>(null);

  // IMEI Selector State
  const [showImeiSelector, setShowImeiSelector] = useState(false);
  const [imeiSelectorProduct, setImeiSelectorProduct] = useState<any>(null);
  const [availableImeis, setAvailableImeis] = useState<any[]>([]);
  const [isLoadingImeis, setIsLoadingImeis] = useState(false);
  const { settings, company } = useThermalSettings();

  // Effects
  useEffect(() => {
    // Fetch payment methods
    fetch('/api/payment-methods')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const names = data.map((m: any) => m.name);
          setAvailableMethods(names);
          if (!names.includes(paymentMethod)) {
            setPaymentMethod(names[0]);
          }
        }
      })
      .catch(err => console.error('Error fetching payment methods:', err));
  }, []);

  // Fetch "Walk-in Customer" on startup (to keep a reference if needed, but don't select by default)
  useEffect(() => {
    const fetchWalkIn = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const customers = await response.json();
          const walkIn = customers.find((c: any) => c.name === 'Walk-in Customer');
          if (walkIn) {
            walkInCustomerRef.current = walkIn;
          }
        }
      } catch (error) {
        console.error('Error fetching walk-in customer:', error);
      }
    };
    fetchWalkIn();
  }, []);

  // Fetch pre-selected customer if provided
  useEffect(() => {
    if (preSelectedCustomerId) {
      fetch(`/api/customers/${preSelectedCustomerId}`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setSelectedCustomer(data);
            addActivity('Customer Selected', `${data.name} attached to sale`, 'customer');
          }
        })
        .catch(err => console.error('Error fetching pre-selected customer:', err));
    }
  }, [preSelectedCustomerId]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchProducts();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      const delayDebounceFn = setTimeout(() => {
        fetchCustomers();
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setCustomerResults([]);
    }
  }, [customerSearch]);

  // Handlers
  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=products`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(customerSearch)}&type=customers`);
      if (response.ok) {
        const data = await response.json();
        setCustomerResults(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addActivity = (action: string, details: string, type: Activity['type'] = 'system') => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      action,
      details,
      type
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 20));
  };

  const addToCart = (product: Product | any) => {
    // If it's a serialized product and no IMEI is selected yet, open the selector
    if (product.product_type === 'serialized' && !product.imei) {
      handleOpenImeiSelector(product);
      return;
    }

    setCart(prevCart => {
      // For serialized products, we match by product id AND device_id/imei
      const existingItemIndex = prevCart.findIndex(item => 
        item.id === product.id && 
        (product.product_type !== 'serialized' || item.device_id === product.device_id)
      );

      if (existingItemIndex > -1 && product.product_type !== 'serialized') {
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    addActivity('Added to Cart', `${product.product_name} added`, 'stock');
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateQuantity = (productId: number, delta: number, deviceId?: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId && (!deviceId || item.device_id === deviceId)) {
          const newQty = Math.max(1, item.quantity + delta);
          if (newQty !== item.quantity) {
            addActivity('Quantity Changed', `${item.product_name}: ${item.quantity} → ${newQty}`, 'stock');
          }
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const updatePrice = (productId: number, newPrice: number, deviceId?: number) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId && (!deviceId || item.device_id === deviceId)) {
          const oldPrice = item.customPrice ?? item.selling_price;
          if (newPrice !== oldPrice) {
            addActivity('Price Changed', `${item.product_name}: €${oldPrice.toFixed(2)} → €${newPrice.toFixed(2)}`, 'sale');
          }
          return { ...item, customPrice: newPrice };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: number, deviceId?: number) => {
    const itemToRemove = cart.find(item => item.id === productId && (!deviceId || item.device_id === deviceId));
    setCart(prevCart => prevCart.filter(item => !(item.id === productId && (!deviceId || item.device_id === deviceId))));
    if (itemToRemove) {
      addActivity('Removed from Cart', `${itemToRemove.product_name} removed`, 'stock');
    }
  };

  const handleAddPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (paymentMethod === 'Wallet') {
      const balance = selectedCustomer?.wallet_balance || 0;
      if (amount > balance) {
        alert(`Insufficient wallet balance. Available: €${balance.toFixed(2)}`);
        return;
      }
    }

    setAddedPayments(prev => [...prev, { method: paymentMethod, amount }]);
    setPaymentAmount('');
    addActivity('Payment Added', `€${amount.toFixed(2)} via ${paymentMethod}`, 'sale');
  };

  const removePayment = (index: number) => {
    setAddedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleOpenImeiSelector = async (product: Product) => {
    setImeiSelectorProduct(product);
    setShowImeiSelector(true);
    setIsLoadingImeis(true);
    try {
      const response = await fetch(`/api/products/${product.product_id}/available-devices`);
      if (response.ok) {
        const data = await response.json();
        setAvailableImeis(data);
      }
    } catch (error) {
      console.error('Error fetching IMEIs:', error);
    } finally {
      setIsLoadingImeis(false);
    }
  };

  const handleSaveNewCustomer = async (customerData: Partial<Customer>) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customerData)
      });

      if (response.ok) {
        const customer = await response.json();
        setSelectedCustomer(customer);
        setShowNewCustomerModal(false);
        addActivity('New Customer', `${customer.name} registered`, 'customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    const invoiceData = {
      customer_id: selectedCustomer?.id || null,
      subtotal,
      tax_total: 0,
      discount_total: 0,
      grand_total: total,
      items: cart.map(item => ({
        sku_id: item.id,
        device_id: item.device_id,
        imei: item.imei,
        quantity: item.quantity,
        price: item.customPrice ?? item.selling_price,
        total: (item.customPrice ?? item.selling_price) * item.quantity
      })),
      payments: addedPayments,
      activities: activities
    };

    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const result = await response.json();
        // Fetch full invoice details for printing
        const fullInvoiceRes = await fetch(`/api/invoices/${result.id}`);
        const fullInvoice = await fullInvoiceRes.json();
        
        setLastInvoiceData(fullInvoice);
        setShowCheckoutModal(true);
        addActivity('Checkout Complete', `Invoice #${fullInvoice.invoice_number} generated`, 'sale');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const resetRegister = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAddedPayments([]);
    setPaymentAmount('');
    setShowCheckoutModal(false);
    setLastInvoiceData(null);
    setSearchQuery('');
    setCustomerSearch('');
    setActivities([]); // Reset activities for the new invoice
  };

  const handlePrint = (type: 'Thermal' | 'A4') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.selling_price) * item.quantity, 0);
  const total = subtotal; // Simplified for now
  const paidAmount = addedPayments.reduce((sum, p) => sum + p.amount, 0);
  const remainingAmount = total - paidAmount;
  const isPaymentComplete = remainingAmount <= 0.01;

  useEffect(() => {
    if (remainingAmount > 0) {
      setPaymentAmount(remainingAmount.toFixed(2));
    } else {
      setPaymentAmount('');
    }
  }, [remainingAmount]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header Area */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-md text-white shadow-lg shadow-blue-100">
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight uppercase">Register</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden p-6 gap-6">
        {/* Left Side: Product Search & Cart */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Search Bar */}
          <div className="relative shrink-0">
            <ProductSearchBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onClear={() => setSearchQuery('')}
            />
            
            {/* Search Results Dropdown */}
            <SearchResults 
              results={searchResults}
              onAddProduct={addToCart}
            />
          </div>

          {/* Cart Table */}
          <CartTable 
            cart={cart}
            onUpdateQuantity={updateQuantity}
            onUpdatePrice={updatePrice}
            onRemove={removeFromCart}
            onOpenImeiSelector={handleOpenImeiSelector}
          />

          {/* Activity Log */}
          <ActivityLog activities={activities} />
        </div>

        {/* Right Side: Sidebar (Customer, Totals, Payment) */}
        <Sidebar 
          selectedCustomer={selectedCustomer}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          customerResults={customerResults}
          onSelectCustomer={(c) => {
            setSelectedCustomer(c);
            setCustomerSearch('');
            setCustomerResults([]);
            addActivity('Customer Selected', `${c.name} attached to sale`, 'customer');
          }}
          onClearCustomer={() => setSelectedCustomer(null)}
          onOpenNewCustomerModal={() => setShowNewCustomerModal(true)}
          
          subtotal={subtotal}
          tax={0}
          discount={0}
          total={total}
          
          addedPayments={addedPayments}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          paymentAmount={paymentAmount}
          setPaymentAmount={setPaymentAmount}
          onAddPayment={handleAddPayment}
          onRemovePayment={removePayment}
          remainingAmount={remainingAmount}
          
          onCheckout={handleCheckout}
          onClearCart={() => setShowDiscardConfirm(true)}
          isCartEmpty={cart.length === 0 && !selectedCustomer && addedPayments.length === 0}
          isPaymentComplete={isPaymentComplete}
          availableMethods={availableMethods}
        />
      </div>

      {/* Modals */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Discard Sale?</h3>
              <p className="text-slate-500 text-sm mb-6">Are you sure you want to clear the current cart and reset the transaction? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-3 rounded-md font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    resetRegister();
                    addActivity('Cart Cleared', 'Transaction discarded and reset to default', 'system');
                    setShowDiscardConfirm(false);
                  }}
                  className="flex-1 py-3 rounded-md font-bold text-white bg-red-600 hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCheckoutModal && (
        <CheckoutModal 
          invoice={lastInvoiceData}
          onClose={resetRegister}
          onPrint={handlePrint}
        />
      )}

      {showImeiSelector && imeiSelectorProduct && (
        <ImeiSelectorModal 
          product={imeiSelectorProduct}
          availableImeis={availableImeis}
          isLoading={isLoadingImeis}
          onClose={() => setShowImeiSelector(false)}
          onSelect={(device) => {
            addToCart({
              ...imeiSelectorProduct,
              device_id: device.id,
              imei: device.imei
            });
            setShowImeiSelector(false);
          }}
        />
      )}

      {showNewCustomerModal && (
        <CustomerFormModal 
          onClose={() => setShowNewCustomerModal(false)}
          onSave={handleSaveNewCustomer}
        />
      )}

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
        {lastInvoiceData && (
          <div className={printType === 'Thermal' ? 'w-[80mm]' : 'w-full'}>
            <ThermalReceipt invoice={lastInvoiceData} settings={settings} company={company} />
          </div>
        )}
      </div>
    </div>
  );
}
