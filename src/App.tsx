import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Wrench, 
  FileText, 
  Users, 
  Package, 
  LayoutGrid, 
  Smartphone,
  Search,
  Sun,
  Moon,
  ShoppingBag,
  Banknote,
  ArrowLeftRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Routes, Route, useNavigate, useParams, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import CashRegister from './components/CashRegister';
import ProductList from './components/ProductList';
import InvoiceList from './components/InvoiceList';
import CustomerList from './components/CustomerList';
import CustomerDetails from './components/CustomerDetails';
import RepairList from './components/RepairList';
import DeviceInventory from './components/DeviceInventory';
import PurchaseOrderList from './components/PurchaseOrderList';
import PurchaseOrderDetail from './components/PurchaseOrderDetail';
import Dashboard from './components/Dashboard';
import InvoiceDetails from './components/InvoiceDetails';
import HomeMenu from './components/HomeMenu';
import SkuDeviceDetails from './components/SkuDeviceDetails';
import ManageData from './components/ManageData';
import EndOfDay from './components/EndOfDay';
import ErrorBoundary from './components/ErrorBoundary';
import CreateProduct from './components/CreateProduct';
import ProductDetails from './components/ProductDetails';
import AddInventory from './components/AddInventory';
import DeviceDetailView from './components/inventory/DeviceDetails';
import GettingStarted from './components/GettingStarted';
import BranchTransfer from './components/BranchTransfer';
import AdminPortal from './components/admin/AdminPortal';
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import AdminLoginPage from './components/auth/AdminLoginPage';
import PublicProfile from './components/PublicProfile';
import { AuthProvider, useAuth } from './context/AuthContext';

const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

// ─── Route Wrapper Components ─────────────────────────────────────────────────

const PublicProfileRoute = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  return <PublicProfile slug={slug!} onBack={() => navigate('/')} />;
};

const CashRegisterRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  const initiateDeposit = location.state?.initiateDeposit || false;
  const preSelectedCustomerId = location.state?.customerId || null;

  return (
    <CashRegister 
      preSelectedCustomerId={preSelectedCustomerId}
      initiateDeposit={initiateDeposit}
      onViewCustomers={() => navigate(`/${branchSlug}/customers`)} 
      onSelectCustomer={(id) => navigate(`/${branchSlug}/customers/${id}`)}
      onSelectProduct={(id) => navigate(`/${branchSlug}/products/${id}`)}
    />
  );
};

const ProductListRoute = () => {
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <ProductList 
      onCreateProduct={() => navigate(`/${branchSlug}/create-product`)} 
      onSelectProduct={(id) => navigate(`/${branchSlug}/products/${id}`)}
    />
  );
};

const ProductDetailsRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <ProductDetails 
      productId={Number(id)} 
      onBack={() => navigate(`/${branchSlug}/products`)}
      onAddInventory={(id) => navigate(`/${branchSlug}/add-inventory/${id}`)}
      onViewDevices={(id) => navigate(`/${branchSlug}/sku-devices/${id}`, { state: { from: `/${branchSlug}/products/${id}` } })}
    />
  );
};

const AddInventoryRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <AddInventory 
      productId={Number(id)} 
      onBack={() => navigate(`/${branchSlug}/products/${id}`)}
      onSuccess={() => navigate(`/${branchSlug}/products/${id}`)}
    />
  );
};

const InvoiceListRoute = () => {
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <InvoiceList 
      onSelectInvoice={(id) => navigate(`/${branchSlug}/invoices/${id}`)} 
      onSelectCustomer={(id) => navigate(`/${branchSlug}/customers/${id}`)}
    />
  );
};

const InvoiceDetailsRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <InvoiceDetails 
      invoiceId={Number(id)} 
      onBack={() => navigate(`/${branchSlug}/invoices`)} 
      onSelectCustomer={(customerId) => navigate(`/${branchSlug}/customers/${customerId}`)}
    />
  );
};

const CustomerListRoute = () => {
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <CustomerList 
      onSelectCustomer={(id) => navigate(`/${branchSlug}/customers/${id}`)} 
    />
  );
};

const CustomerDetailsRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <CustomerDetails 
      customerId={Number(id)} 
      onBack={() => navigate(`/${branchSlug}/customers`)} 
      onSelectInvoice={(invId) => navigate(`/${branchSlug}/invoices/${invId}`)}
      onCreateInvoice={() => navigate(`/${branchSlug}/register`)}
      onCreateRepair={() => navigate(`/${branchSlug}/repairs`, { state: { customerId: Number(id) } })}
      onDeposit={() => navigate(`/${branchSlug}/register`, { state: { initiateDeposit: true, customerId: Number(id) } })}
    />
  );
};

const RepairListRoute = () => {
  const location = useLocation();
  const customerId = location.state?.customerId || null;
  return <RepairList preSelectedCustomerId={customerId} />;
};

const DeviceInventoryRoute = () => {
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <DeviceInventory 
      onSelectPO={(poNumber) => {
        fetch(`/api/purchase-orders/by-number/${poNumber}`)
          .then(res => res.json())
          .then(data => {
            if (data.id) {
              navigate(`/${branchSlug}/purchase-orders/${data.id}`);
            }
          });
      }}
      onSelectProduct={(skuId) => navigate(`/${branchSlug}/sku-devices/${skuId}`, { state: { from: `/${branchSlug}/devices` } })}
      onSelectDevice={(id) => navigate(`/${branchSlug}/devices/${id}`)}
    />
  );
};

const DeviceDetailRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <DeviceDetailView 
      deviceId={Number(id)} 
      onBack={() => navigate(`/${branchSlug}/devices`)} 
      onOpenPrinterSettings={() => navigate(`/${branchSlug}/getting-started?tab=manage-label-printer`)}
    />
  );
};

const SkuDeviceDetailsRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  const backUrl = location.state?.from || `/${branchSlug}/devices`;
  return (
    <SkuDeviceDetails 
      skuId={Number(id)} 
      onBack={() => navigate(backUrl)} 
    />
  );
};

const PurchaseOrderListRoute = () => {
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <PurchaseOrderList 
      onSelectPO={(id) => navigate(`/${branchSlug}/purchase-orders/${id}`)}
    />
  );
};

const PurchaseOrderDetailRoute = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const branchSlug = slugify(useAuth().currentUser?.branch_name || 'branch');
  return (
    <PurchaseOrderDetail 
      poId={Number(id)}
      onBack={() => navigate(`/${branchSlug}/purchase-orders`)}
    />
  );
};

const GettingStartedRoute = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab') || undefined;
  return <GettingStarted initialTab={tab} />;
};

// ─── Main Application Components ──────────────────────────────────────────────

function AppInner() {
  const { currentUser, isAdmin, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-app)] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[var(--border-base)] border-t-[var(--brand-primary)] rounded-full animate-spin mb-4" />
        <div className="text-[var(--text-muted)] font-bold text-sm tracking-widest uppercase animate-pulse">Initializing System...</div>
      </div>
    );
  }

  // Auth flow for non-logged-in users
  if (!currentUser) {
    const resetToken = searchParams.get('reset_token');
    return (
      <Routes>
        <Route path="/signup" element={<SignupPage onGoLogin={() => navigate('/')} />} />
        <Route path="/forgot" element={<ForgotPassword onBack={() => navigate('/')} />} />
        <Route path="/reset" element={
          resetToken ? <ResetPassword token={resetToken} onGoLogin={() => navigate('/')} /> : <Navigate to="/" replace />
        } />
        <Route path="/admin-login" element={<AdminLoginPage onBack={() => navigate('/')} />} />
        <Route path="/:slug" element={<PublicProfileRoute />} />
        <Route path="/" element={
          <LoginPage 
            onGoSignup={() => navigate('/signup')} 
            onForgotPassword={() => navigate('/forgot')} 
            onAdminLogin={() => navigate('/admin-login')}
          />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  // Determine current active view for sidebar highlighting
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentView = pathParts[1] || 'home';
  const isDetailView = pathParts.length > 2;
  const branchSlug = slugify(currentUser.branch_name || 'branch');

  // If user tries to access root or standard auth paths while logged in, redirect to their branch home
  if (['', 'login', 'signup', 'forgot', 'reset', 'admin-login'].includes(pathParts[0] || '')) {
    return <Navigate to={`/${branchSlug}/home`} replace />;
  }

  const handleSidebarNavigate = (view: string) => {
    navigate(`/${branchSlug}/${view}`);
  };

  const menuItems = [
    { id: 'register', label: 'Cash Register', icon: ShoppingCart },
    { id: 'repairs', label: 'Repairs', icon: Wrench },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingBag },
    { id: 'end-of-day', label: 'End of Day', icon: Banknote },
    { id: 'devices', label: 'Devices Inventory', icon: Smartphone },
    { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight },
  ];

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-app)] font-sans text-[var(--text-main)] overflow-hidden transition-colors duration-300">
      {showAdminPortal && isAdmin && <AdminPortal onClose={() => setShowAdminPortal(false)} />}

      {/* Header */}
      <header className="h-14 bg-[var(--bg-header)] flex items-center justify-between z-30 transition-colors duration-300">
        <div className="flex h-full items-center">
          <div className="w-28 flex items-center justify-center h-full">
            <button 
              onClick={() => navigate(`/${branchSlug}/home`)}
              className="transition-all hover:scale-115 p-2 bg-[rgb(2,133,181)] text-white rounded-md shadow-sm flex items-center justify-center"
              title="Home Menu"
            >
              <LayoutGrid size={24} />
            </button>
          </div>
          
          <button 
            onClick={() => navigate(`/${branchSlug}/home`)} 
            className="pl-6 flex flex-col items-start font-sans cursor-pointer hover:opacity-85 transition-opacity"
            title="Home Menu"
          >
            <h1 className="text-[20px] font-bold text-[var(--brand-primary)] font-sans tracking-tight leading-none uppercase">
              {currentUser?.branch_name || 'EPOS'}
            </h1>
          </button>
        </div>

        <div className="flex-1 max-w-xl px-12">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
            <input 
              type="text" 
              placeholder="Search here" 
              className="w-full bg-[var(--bg-card)] border border-[var(--border-base)] rounded-full py-1.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-[var(--text-muted)] text-[var(--text-main)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 px-6">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-[var(--text-main)] flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {isAdmin && (
            <button 
              onClick={() => setShowAdminPortal(true)}
              className="h-8 overflow-hidden group bg-transparent text-[var(--text-main)] px-3 rounded-full text-[11px] uppercase tracking-widest transition-all cursor-pointer"
            >
              <div className="flex flex-col transition-transform duration-500 group-hover:-translate-y-8 ease-in-out">
                <div className="h-8 flex items-center justify-center whitespace-nowrap">
                  Admin
                </div>
                <div className="h-8 flex items-center justify-center whitespace-nowrap text-blue-600">
                  Log In
                </div>
              </div>
            </button>
          )}
          
          <button 
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="h-8 overflow-hidden group bg-[var(--bg-card)] text-[var(--text-main)] px-5 rounded-full text-[11px] uppercase tracking-widest transition-all border border-[var(--border-base)] shadow-sm cursor-pointer"
          >
            <div className="flex flex-col transition-transform duration-500 group-hover:-translate-y-8 ease-in-out">
              <div className="h-8 flex items-center justify-center whitespace-nowrap">
                {currentUser.name}
              </div>
              <div className="h-8 flex items-center justify-center whitespace-nowrap text-red-500">
                Log Out
              </div>
            </div>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-28 bg-[var(--bg-sidebar)] text-white flex flex-col z-20 shadow-xl">
          <nav className="flex-1 py-1 flex flex-col items-center">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSidebarNavigate(item.id)}
                className={`w-full flex flex-col items-center justify-center py-5 px-1 transition-all duration-200 border-l-4 ${
                  currentView === item.id 
                    ? 'bg-white/10 border-[var(--brand-primary)] text-white' 
                    : 'border-transparent text-[var(--text-muted-more)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={24} />
                <span className="text-[11px] mt-2 text-center font-normal leading-tight uppercase tracking-wide">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-[var(--bg-app)] transition-colors duration-300">
          <ErrorBoundary>
            {/* Permanent Keep-Alive Panel Stack (Instant Swap, 0ms, Wipes Re-renders, Preserves Scans & Inputs) */}
            <div className={(!isDetailView && currentView === 'home') ? 'h-full' : 'hidden'}>
              <HomeMenu onNavigate={handleSidebarNavigate} />
            </div>
            <div className={(!isDetailView && currentView === 'dashboard') ? 'h-full' : 'hidden'}>
              <Dashboard />
            </div>
            <div className={(!isDetailView && currentView === 'register') ? 'h-full' : 'hidden'}>
              <CashRegisterRoute />
            </div>
            <div className={(!isDetailView && currentView === 'products') ? 'h-full' : 'hidden'}>
              <ProductListRoute />
            </div>
            <div className={(!isDetailView && currentView === 'invoices') ? 'h-full' : 'hidden'}>
              <InvoiceListRoute />
            </div>
            <div className={(!isDetailView && currentView === 'customers') ? 'h-full' : 'hidden'}>
              <CustomerListRoute />
            </div>
            <div className={(!isDetailView && currentView === 'repairs') ? 'h-full' : 'hidden'}>
              <RepairListRoute />
            </div>
            <div className={(!isDetailView && currentView === 'devices') ? 'h-full' : 'hidden'}>
              <DeviceInventoryRoute />
            </div>
            <div className={(!isDetailView && currentView === 'transfers') ? 'h-full' : 'hidden'}>
              <BranchTransfer />
            </div>
            <div className={(!isDetailView && currentView === 'purchase-orders') ? 'h-full' : 'hidden'}>
              <PurchaseOrderListRoute />
            </div>

            {/* Standard Router Switcher for occasional Detail & Modal Sub-Pages */}
            {(isDetailView || ![
              'home', 'dashboard', 'register', 'products', 'invoices', 
              'customers', 'repairs', 'devices', 'transfers', 'purchase-orders'
            ].includes(currentView)) && (
              <Routes>
                <Route path="/:branchSlug/products/:id" element={<ProductDetailsRoute />} />
                <Route path="/:branchSlug/create-product" element={<CreateProduct onCancel={() => navigate(`/${branchSlug}/products`)} onSave={() => navigate(`/${branchSlug}/products`)} />} />
                <Route path="/:branchSlug/add-inventory/:id" element={<AddInventoryRoute />} />
                <Route path="/:branchSlug/invoices/:id" element={<InvoiceDetailsRoute />} />
                <Route path="/:branchSlug/customers/:id" element={<CustomerDetailsRoute />} />
                <Route path="/:branchSlug/devices/:id" element={<DeviceDetailRoute />} />
                <Route path="/:branchSlug/sku-devices/:id" element={<SkuDeviceDetailsRoute />} />
                <Route path="/:branchSlug/purchase-orders/:id" element={<PurchaseOrderDetailRoute />} />
                <Route path="/:branchSlug/manage-data" element={<ManageData />} />
                <Route path="/:branchSlug/end-of-day" element={<EndOfDay />} />
                <Route path="/:branchSlug/getting-started" element={<GettingStartedRoute />} />
                <Route path="*" element={<Navigate to={`/${branchSlug}/dashboard`} replace />} />
              </Routes>
            )}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
