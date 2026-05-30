import React, { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  XCircle
} from 'lucide-react';
import ThermalReceipt from './ThermalReceipt';
import { Product, Customer, Invoice } from '../types';
import { safeCustomerName } from '../utils/customerName';

// Import refactored components
import { ProductSearchBar } from './cash-register/ProductSearchBar';
import { SearchResults } from './cash-register/SearchResults';
import { CartTable } from './cash-register/CartTable';
import { ActivityLog } from './cash-register/ActivityLog';
import { Sidebar } from './cash-register/Sidebar';
import { ReviewCheckoutModal } from './cash-register/ReviewCheckoutModal';
import { ImeiSelectorModal } from './cash-register/ImeiSelectorModal';
import { DepositAmountModal } from './cash-register/DepositAmountModal';
import { UpdateCartModal } from './cash-register/UpdateCartModal';
import CustomerFormModal from './CustomerFormModal';
import { CartItem, PaymentEntry, Activity } from './cash-register/types';
import { useThermalSettings } from '../hooks/useThermalSettings';
import { useAuth } from '../context/AuthContext';

interface CashRegisterProps {
  onViewCustomers?: () => void;
  onSelectCustomer?: (id: number) => void;
  preSelectedCustomerId?: number | null;
  initiateDeposit?: boolean;
  onSelectProduct?: (id: number) => void;
}

export default function CashRegister({ onViewCustomers, onSelectCustomer, preSelectedCustomerId, initiateDeposit, onSelectProduct }: CashRegisterProps) {
  const { currentUser } = useAuth();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchIndex, setActiveSearchIndex] = useState(0);

  // Quick Add State
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickBarcode, setQuickBarcode] = useState('');
  const [quickCost, setQuickCost] = useState('');
  const [quickSelling, setQuickSelling] = useState('');
  const [quickCategoryId, setQuickCategoryId] = useState('');
  const [quickStock, setQuickStock] = useState('0');
  const [quickAddLoading, setQuickAddLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('epos_cart');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('epos_customer');
    try { return saved ? JSON.parse(saved) : null; } catch { return null; }
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [availableMethods, setAvailableMethods] = useState<string[]>(['Cash', 'Card']);
  const [addedPayments, setAddedPayments] = useState<PaymentEntry[]>(() => {
    const saved = localStorage.getItem('epos_payments');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [lastInvoiceData, setLastInvoiceData] = useState<any>(null);
  const [printType, setPrintType] = useState<'Thermal' | 'A4'>('Thermal');
  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('epos_activities');
    try { return saved ? JSON.parse(saved) : []; } catch { return []; }
  });
  
  // New Customer Modal State
  const [showNewCustomerModal, setShowNewCustomerModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const walkInCustomerRef = useRef<Customer | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // IMEI Selector State
  const [showImeiSelector, setShowImeiSelector] = useState(false);
  const [imeiSelectorProduct, setImeiSelectorProduct] = useState<any>(null);
  const [availableImeis, setAvailableImeis] = useState<any[]>([]);
  const [isLoadingImeis, setIsLoadingImeis] = useState(false);
  const { settings, company } = useThermalSettings();

  // Update Cart Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);

  // Deposit State
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [depositProductInfo, setDepositProductInfo] = useState<any>(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('epos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('epos_customer', JSON.stringify(selectedCustomer));
  }, [selectedCustomer]);

  useEffect(() => {
    localStorage.setItem('epos_payments', JSON.stringify(addedPayments));
  }, [addedPayments]);

  useEffect(() => {
    localStorage.setItem('epos_activities', JSON.stringify(activities));
  }, [activities]);

  // Effects
  useEffect(() => {
    fetch('/api/products/special/get-deposit-product')
      .then(res => res.json())
      .then(data => setDepositProductInfo(data))
      .catch(err => console.error('Error fetching deposit product:', err));
  }, []);

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(err => console.error('Error fetching categories:', err));
  }, []);

  useEffect(() => {
    if (initiateDeposit && preSelectedCustomerId && !showDepositModal) {
      setShowDepositModal(true);
    }
  }, [initiateDeposit, preSelectedCustomerId]);

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
      setActiveSearchIndex(0);
    }
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
  const openQuickAdd = (term: string) => {
    const trimmed = term.trim();
    if (/^\d{6,}$/.test(trimmed)) {
      setQuickBarcode(trimmed);
      setQuickName('');
    } else {
      setQuickName(trimmed);
      setQuickBarcode('');
    }
    setQuickCost('');
    setQuickSelling('');
    setQuickStock('0');
    if (categories.length > 0) {
      setQuickCategoryId(categories[0].id.toString());
    } else {
      setQuickCategoryId('');
    }
    setShowQuickAdd(true);
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return alert('Please enter a product name');
    
    // Safely parse European number formats (e.g. 10,50 -> 10.50)
    const parsePrice = (val: string) => Number(val.replace(',', '.'));
    const parsedSelling = parsePrice(quickSelling);
    const parsedCost = parsePrice(quickCost);

    if (isNaN(parsedSelling) || parsedSelling < 0) {
      return alert('Please enter a valid selling price');
    }

    setQuickAddLoading(true);
    try {
      const payload = {
        name: quickName.trim(),
        category_id: quickCategoryId ? Number(quickCategoryId) : null,
        manufacturer_id: null,
        selling_price: parsedSelling,
        cost_price: isNaN(parsedCost) ? 0 : parsedCost,
        sku_code: quickBarcode.trim() || undefined,
        barcode: quickBarcode.trim() || undefined,
        branch_id: currentUser?.branch_id || 1,
        quantity: parseInt(quickStock) || 0
      };

      const res = await fetch('/api/products/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to quick add product');
      }

      const fullProduct = await res.json();

      addToCart({
        ...fullProduct,
        allow_overselling: true,
        total_stock: payload.quantity > 0 ? payload.quantity : 0
      });

      addActivity('Quick Add Product', `Product "${quickName}" created and added to cart`, 'stock');
      setShowQuickAdd(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err: any) {
      console.error('Quick Add error:', err);
      alert(err.message || 'An error occurred during quick add');
    } finally {
      setQuickAddLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&type=products`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(Array.isArray(data) ? data : []);
        setActiveSearchIndex(0);
      } else {
        setSearchResults([]);
        setActiveSearchIndex(0);
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
        setCustomerResults(Array.isArray(data) ? data : []);
      } else {
        setCustomerResults([]);
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

    // Senior-Level Validation: Block duplicates and stock overruns
    const isSerialized = product.product_type === 'serialized';
    
    // Check if this specific IMEI is already in the cart
    if (isSerialized && product.device_id) {
      const inCart = cart.some(item => item.device_id === product.device_id);
      if (inCart) {
        addActivity('Cart Blocked', `IMEI ${product.imei} is already in the cart`, 'system');
        return;
      }
    }

    // Check stock for non-serialized items if overselling is disabled
    if (!isSerialized && !product.allow_overselling) {
      const existing = cart.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const available = product.total_stock || 0;
      
      if (currentQty >= available) {
        addActivity('Stock Limit', `Cannot add more ${product.product_name}. Stock: ${available}`, 'stock');
        return;
      }
    }

    setCart(prevCart => {
      // For serialized products, we match by product id AND device_id/imei
      const existingItemIndex = prevCart.findIndex(item => 
        item.id === product.id && 
        (!isSerialized || item.device_id === product.device_id)
      );

      if (existingItemIndex > -1 && !isSerialized) {
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
          // Serialized items are locked at quantity 1
          if (item.product_type === 'serialized') {
            return item;
          }

          const newQty = Math.max(1, item.quantity + delta);
          
          // Stock validation for quantity increase
          if (delta > 0 && !item.allow_overselling) {
            if (newQty > (item.total_stock || 0)) {
              addActivity('Stock Limit', `Exceeded stock for ${item.product_name}`, 'stock');
              return item;
            }
          }

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

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
    setShowUpdateModal(true);
  };

  const handleUpdateCartItem = (updatedFields: Partial<CartItem>) => {
    if (!editingItem) return;

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === editingItem.id && (!editingItem.device_id || item.device_id === editingItem.device_id)) {
          const updatedItem = { ...item, ...updatedFields };
          
          // Log activity for significant changes
          if (updatedFields.quantity && updatedFields.quantity !== item.quantity) {
            addActivity('Quantity Updated', `${item.product_name}: ${item.quantity} → ${updatedFields.quantity}`, 'stock');
          }
          if (updatedFields.customPrice && updatedFields.customPrice !== (item.customPrice ?? item.selling_price)) {
            addActivity('Price Updated', `${item.product_name}: €${(item.customPrice ?? item.selling_price).toFixed(2)} → €${updatedFields.customPrice.toFixed(2)}`, 'sale');
          }
          if (updatedFields.discount !== undefined) {
            addActivity('Discount Applied', `${item.product_name}: ${updatedFields.discount}${updatedFields.discountType === 'percentage' ? '%' : '€'} discount`, 'sale');
          }

          return updatedItem;
        }
        return item;
      });
    });

    setShowUpdateModal(false);
    setEditingItem(null);
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

  const handleAddDepositToCart = (amount: number) => {
    if (!depositProductInfo || !selectedCustomer) return;
    
    const existingIndex = cart.findIndex(c => c.is_deposit);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex] = {
        ...newCart[existingIndex],
        price: newCart[existingIndex].price + amount,
        selling_price: (newCart[existingIndex].selling_price || 0) + amount,
        customPrice: (newCart[existingIndex].customPrice || 0) + amount,
        total: newCart[existingIndex].total + amount
      };
      setCart(newCart);
    } else {
      setCart(prev => [{
        id: depositProductInfo.sku_id,
        name: depositProductInfo.product_name,
        category: 'Service',
        price: amount,
        selling_price: amount,
        customPrice: amount,
        quantity: 1,
        total: amount,
        is_deposit: true
      }, ...prev]);
    }
    
    setShowDepositModal(false);
    addActivity('Item Added', `Wallet Deposit for €${amount.toFixed(2)}`, 'item');
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
        addActivity('New Customer', `${safeCustomerName(customer)} registered`, 'customer');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setShowReviewModal(true);
  };

  const handleFinalizeTransaction = async (printPreference: 'Thermal' | 'A4' | null) => {
    const invoiceData = {
      customer_id: selectedCustomer?.id || null,
      subtotal,
      tax_total: 0,
      discount_total: 0,
      grand_total: total,
      items: cart.map(item => {
        const itemPrice = item.customPrice ?? item.selling_price;
        let itemTotal = itemPrice * item.quantity;
        if (item.discount) {
          if (item.discountType === 'percentage') {
            itemTotal = itemTotal * (1 - item.discount / 100);
          } else {
            itemTotal = itemTotal - item.discount;
          }
        }
        return {
          sku_id: item.id,
          device_id: item.device_id,
          imei: item.imei,
          quantity: item.quantity,
          price: itemPrice,
          discount: item.discount || 0,
          discount_type: item.discountType || 'percentage',
          total: Math.max(0, itemTotal),
          is_deposit: item.is_deposit || false,
          notes: item.notes || ''
        };
      }),
      payments: addedPayments,
      activities: activities
    };

    setIsFinalizing(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        const fullInvoice = await response.json();
        
        setLastInvoiceData(fullInvoice);
        setShowReviewModal(false);
        addActivity('Checkout Complete', `Invoice #${fullInvoice.invoice_number} generated`, 'sale');

        if (printPreference) {
          setPrintType(printPreference);
          setTimeout(() => {
            window.print();
            resetRegister();
          }, 300);
        } else {
          resetRegister();
        }
      } else {
        const err = await response.json();
        alert('Checkout failed: ' + (err.error || 'Server error'));
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert('Checkout failed: ' + (error.message || error));
    } finally {
      setIsFinalizing(false);
    }
  };

  const resetRegister = () => {
    setCart([]);
    setSelectedCustomer(null);
    setAddedPayments([]);
    setPaymentAmount('');
    setShowReviewModal(false);
    setLastInvoiceData(null);
    setSearchQuery('');
    setCustomerSearch('');
    setActivities([]); // Reset activities for the new invoice
    
    // Clear persistence
    localStorage.removeItem('epos_cart');
    localStorage.removeItem('epos_customer');
    localStorage.removeItem('epos_payments');
    localStorage.removeItem('epos_activities');
  };

  const handlePrint = (type: 'Thermal' | 'A4') => {
    setPrintType(type);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.customPrice ?? item.selling_price) * item.quantity, 0);
  
  const discountTotal = cart.reduce((sum, item) => {
    if (!item.discount) return sum;
    const itemSubtotal = (item.customPrice ?? item.selling_price) * item.quantity;
    if (item.discountType === 'percentage') {
      return sum + (itemSubtotal * (item.discount / 100));
    } else {
      return sum + item.discount;
    }
  }, 0);

  const total = Math.max(0, subtotal - discountTotal);
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
    <div className="h-full flex flex-col bg-[var(--bg-app)] overflow-hidden transition-colors duration-300">
      {/* Header Area */}
      <div className="bg-[var(--bg-card)] px-6 py-4 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-normal text-[var(--text-main)] uppercase tracking-wide">Register</h1>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden px-6 py-0 gap-0">
        {/* Left Side: Product Search & Cart */}
        <div className="flex-1 flex flex-col pt-6 pb-6 pr-6 border-r border-[var(--border-base)] min-w-0">
          {/* Search Bar & Results (Floating setup) */}
          <div ref={searchContainerRef} className="shrink-0 mb-3 relative z-50">
            <ProductSearchBar 
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onClear={() => setSearchQuery('')}
              onKeyDown={(e) => {
                const filteredResults = searchResults.filter(p => !p.device_id || !cart.some(c => c.device_id === p.device_id));
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveSearchIndex(prev => Math.min(prev + 1, filteredResults.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveSearchIndex(prev => Math.max(prev - 1, 0));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  if (filteredResults.length > 0) {
                    const selectedItem = filteredResults[activeSearchIndex] || filteredResults[0];
                    addToCart(selectedItem);
                  }
                }
              }}
              onQuickAddClick={() => openQuickAdd(searchQuery)}
            />
            
            {/* Search Results (Floating) */}
            <SearchResults 
              results={searchResults.filter(p => !p.device_id || !cart.some(c => c.device_id === p.device_id))}
              searchQuery={searchQuery}
              onAddProduct={addToCart}
              onQuickAddClick={(term) => openQuickAdd(term)}
              activeIndex={activeSearchIndex}
            />
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
            {/* Cart Table */}
            <CartTable 
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onUpdatePrice={updatePrice}
              onRemove={removeFromCart}
              onOpenImeiSelector={handleOpenImeiSelector}
              onEdit={handleEditItem}
              onSelectProduct={onSelectProduct}
            />

            {/* Activity Log */}
            <ActivityLog activities={activities} />
          </div>
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
          onOpenDepositModal={() => setShowDepositModal(true)}
          
          subtotal={subtotal}
          tax={0}
          discount={discountTotal}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] rounded-md shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--border-base)]">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-[var(--bg-hover)] rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle size={32} className="text-[var(--brand-danger)]" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-main)] mb-2 uppercase tracking-tight">Discard Sale?</h3>
              <p className="text-[var(--text-muted)] text-sm mb-6">Are you sure you want to clear the current cart and reset the transaction? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDiscardConfirm(false)}
                  className="flex-1 py-3 rounded-md font-bold text-[var(--text-muted)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-base)]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    resetRegister();
                    addActivity('Cart Cleared', 'Transaction discarded and reset to default', 'system');
                    setShowDiscardConfirm(false);
                  }}
                  className="flex-1 py-3 rounded-md font-bold text-white bg-[var(--brand-danger)] hover:bg-[var(--brand-danger-hover)] transition-all shadow-lg shadow-red-100"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showReviewModal && (
        <ReviewCheckoutModal 
          grandTotal={total}
          payments={addedPayments}
          isFinalizing={isFinalizing}
          onCancel={() => setShowReviewModal(false)}
          onConfirm={handleFinalizeTransaction}
        />
      )}

      {showDepositModal && (
        <DepositAmountModal 
          customer={selectedCustomer}
          onClose={() => setShowDepositModal(false)}
          onAddDeposit={handleAddDepositToCart}
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

      {showUpdateModal && editingItem && (
        <UpdateCartModal 
          item={editingItem}
          onClose={() => {
            setShowUpdateModal(false);
            setEditingItem(null);
          }}
          onSave={handleUpdateCartItem}
        />
      )}

      {showQuickAdd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--bg-card)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-[var(--border-base)] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[var(--border-base)] bg-[var(--bg-app)] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                <h3 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-wide">⚡ Quick Add Product</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors border-0 bg-transparent p-0 cursor-pointer"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            {/* Modal Form */}
            <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4 flex-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. iPhone 13 Pro Case"
                  className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">SKU / Barcode</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU12345"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={quickBarcode}
                    onChange={(e) => setQuickBarcode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Category *</label>
                  <select
                    required
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-transparent"
                    value={quickCategoryId}
                    onChange={(e) => setQuickCategoryId(e.target.value)}
                  >
                    <option value="" className="bg-[var(--bg-card)]">Choose Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[var(--bg-card)]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Cost Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={quickCost}
                    onChange={(e) => setQuickCost(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Selling Price (€) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={quickSelling}
                    onChange={(e) => setQuickSelling(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[var(--text-muted)] uppercase">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full bg-[var(--bg-app)] border border-[var(--border-base)] rounded px-3 py-2 text-sm text-[var(--text-main)] focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={quickStock}
                    onChange={(e) => setQuickStock(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-[var(--border-base)]">
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(false)}
                  className="flex-1 py-2.5 rounded font-bold text-[var(--text-muted)] bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] transition-all border border-[var(--border-base)] cursor-pointer"
                  disabled={quickAddLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer border-0"
                  disabled={quickAddLoading}
                >
                  {quickAddLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Add to Cart'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Container */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
        {lastInvoiceData && (
          <div className={printType === 'Thermal' ? 'w-[72mm]' : 'w-full'}>
            <ThermalReceipt invoice={lastInvoiceData} settings={settings} company={company} />
          </div>
        )}
      </div>
    </div>
  );
}
