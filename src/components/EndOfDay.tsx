import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Printer, 
  List, 
  Save, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  FileText, 
  Euro,
  Calculator,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  X,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Payment, ClosingReport, ClosingReportPayment } from '../types';
import { useThermalSettings } from '../hooks/useThermalSettings';

interface PrintProps {
  reportDate: string;
  startingBalance: number;
  totalSales: number;
  cashCounted: number;
  calculatedCash: number;
  difference: number;
  summaries: any[];
  allPayments: any[];
  comments: string;
}

const EndOfDayThermal: React.FC<PrintProps> = ({
  reportDate,
  startingBalance,
  totalSales,
  cashCounted,
  calculatedCash,
  difference,
  summaries,
  allPayments,
  comments
}) => {
  const { settings, company } = useThermalSettings();
  const now = new Date();

  if (!settings || !company) return null;

  return (
    <div 
      className="thermal-receipt bg-white text-black mx-auto p-4 font-mono text-[12px] leading-tight" 
      id="eod-thermal-receipt"
      style={{ 
        width: '72mm',
        maxWidth: '72mm',
        boxSizing: 'border-box',
        padding: '2mm'
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            margin: 0;
            size: 80mm auto;
          }
          body * {
            visibility: hidden;
          }
          #eod-thermal-receipt, #eod-thermal-receipt * {
            visibility: visible;
          }
          #eod-thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 72mm;
            max-width: 72mm;
            padding: 2mm;
            box-sizing: border-box;
            background: white !important;
            color: black !important;
          }
        }
        .eod-divider {
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .eod-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .eod-header {
          text-align: center;
          margin-bottom: 10px;
        }
        .eod-title {
          font-weight: bold;
          font-size: 14px;
          text-transform: uppercase;
        }
      `}} />

      <div className="eod-header">
        <div className="eod-title">End of Day Report</div>
        <div>{company.name}</div>
        <div>Date: {reportDate}</div>
        <div>Printed: {now.toLocaleString()}</div>
      </div>

      <div className="eod-divider"></div>

      <div className="eod-row">
        <span>Starting Bal:</span>
        <span>€{startingBalance.toFixed(2)}</span>
      </div>
      <div className="eod-row">
        <span>Total Sales:</span>
        <span>€{totalSales.toFixed(2)}</span>
      </div>

      <div className="eod-divider"></div>

      <div className="eod-row font-bold">
        <span>CASH SUMMARY</span>
      </div>
      <div className="eod-row">
        <span>Calculated:</span>
        <span>€{calculatedCash.toFixed(2)}</span>
      </div>
      <div className="eod-row">
        <span>Counted:</span>
        <span>€{cashCounted.toFixed(2)}</span>
      </div>
      <div className="eod-row font-bold">
        <span>Difference:</span>
        <span>€{difference.toFixed(2)}</span>
      </div>

      <div className="eod-divider"></div>

      <div className="eod-row font-bold">
        <span>PAYMENT TYPES</span>
      </div>
      {summaries.map((s, idx) => (
        <div key={idx} className="eod-row">
          <span>{s.payment_type}:</span>
          <span>€{s.calculated.toFixed(2)}</span>
        </div>
      ))}

      {comments && (
        <>
          <div className="eod-divider"></div>
          <div className="font-bold">Comments:</div>
          <div className="italic">{comments}</div>
        </>
      )}

      <div className="eod-divider"></div>

      <div className="text-center text-[10px] italic">
        Powered by iCover EPOS
      </div>
    </div>
  );
};

const EndOfDayA4: React.FC<PrintProps> = ({
  reportDate,
  startingBalance,
  totalSales,
  cashCounted,
  calculatedCash,
  difference,
  summaries,
  allPayments,
  comments
}) => {
  const { company } = useThermalSettings();
  const now = new Date();

  if (!company) return null;

  return (
    <div 
      className="bg-white text-black p-8 font-sans" 
      id="eod-a4-report"
      style={{ 
        width: '210mm',
        minHeight: '297mm',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body * {
            visibility: hidden;
          }
          #eod-a4-report, #eod-a4-report * {
            visibility: visible;
          }
          #eod-a4-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            background: white !important;
            color: black !important;
          }
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
          border-radius: 4px;
          overflow: hidden;
        }
        .report-table th {
          background-color: #1a1a1a;
          color: white;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          padding: 12px 10px;
          border: none;
        }
        .report-table td {
          border-bottom: 1px solid #eee;
          padding: 10px;
          font-size: 11px;
          color: #333;
        }
        .report-table tr:nth-child(even) {
          background-color: #fafafa;
        }
        .text-right {
          text-align: right !important;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px solid #1a1a1a;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .title-section h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 800;
          color: #1a1a1a;
          letter-spacing: -0.02em;
        }
        .company-info {
          text-align: right;
        }
        .company-info .company-name {
          font-size: 18px;
          font-weight: 700;
          color: #1a1a1a;
          margin-bottom: 4px;
        }
        .company-info .company-details {
          font-size: 11px;
          color: #666;
          line-height: 1.4;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 30px;
          margin-bottom: 30px;
        }
        .summary-box {
          background: #fff;
          border: 1px solid #e5e7eb;
          padding: 20px;
          border-radius: 8px;
        }
        .summary-box h3 {
          margin-top: 0;
          margin-bottom: 15px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          color: #999;
          letter-spacing: 0.1em;
          border-bottom: 1px solid #f3f4f6;
          padding-bottom: 10px;
        }
        .stat-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #f9fafb;
          font-size: 13px;
        }
        .stat-row.total {
          margin-top: 10px;
          padding-top: 15px;
          border-top: 2px solid #1a1a1a;
          font-weight: 800;
          font-size: 16px;
        }
      `}} />

      <div className="header-section">
        <div className="title-section">
          <h1>End of Day Report</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-bold rounded uppercase tracking-wider">Date</span>
            <span className="text-sm font-medium">{reportDate}</span>
          </div>
        </div>
        <div className="company-info">
          <div className="company-name">{company.name}</div>
          <div className="company-details">
            {company.address}<br />
            {company.city}<br />
            Tel: {company.phone}
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-box">
          <h3>Reconciliation</h3>
          <div className="stat-row">
            <span>Starting Balance</span>
            <span className="font-semibold text-gray-500">€{startingBalance.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span>Calculated Sales</span>
            <span className="font-semibold text-blue-600">€{totalSales.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span>Calculated Cash in Drawer</span>
            <span className="font-semibold text-blue-600">€{calculatedCash.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span>Actual Cash Counted</span>
            <span className="font-semibold text-amber-600">€{cashCounted.toFixed(2)}</span>
          </div>
          <div className={`stat-row total ${difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <span>Difference</span>
            <span>€{difference.toFixed(2)}</span>
          </div>
        </div>

        <div className="summary-box">
          <h3>Payments by Type</h3>
          <div className="space-y-1">
            {summaries.map((s, idx) => (
              <div key={idx} className="stat-row">
                <span className="font-medium text-gray-700">{s.payment_type}</span>
                <span className="font-bold">€{s.calculated.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-[12px] font-extrabold mb-4 uppercase tracking-[0.2em] text-gray-400">Transaction Breakdown</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Time</th>
              <th>Reference</th>
              <th>Customer</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {allPayments.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 italic text-gray-400 bg-white">No transactions recorded for this period.</td>
              </tr>
            ) : (
              allPayments.map((p, idx) => (
                <tr key={idx}>
                  <td className="font-medium">{p.user_name || 'Staff'}</td>
                  <td className="text-gray-500">{p.paid_at ? new Date(p.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }) : '--:--'}</td>
                  <td className="font-mono text-[10px]">{p.invoice_number || 'DEPOSIT'}</td>
                  <td>{p.customer_name || '--'}</td>
                  <td>
                    <span className="px-1.5 py-0.5 bg-gray-100 rounded text-[9px] font-bold uppercase">{p.method}</span>
                  </td>
                  <td className="text-right font-bold text-gray-900">€{p.amount.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="bg-gray-900 text-white font-bold">
              <td colSpan={5} className="text-right py-3 uppercase text-[10px] tracking-widest">Total Sales for Period</td>
              <td className="text-right py-3 text-lg">€{totalSales.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {comments && (
        <div className="mt-8">
          <h3 className="text-[10px] font-bold mb-2 uppercase tracking-widest text-gray-400">Manager Notes</h3>
          <div className="p-4 bg-gray-50 border-l-4 border-gray-900 text-sm italic text-gray-700 leading-relaxed shadow-sm">
            "{comments}"
          </div>
        </div>
      )}

      <div className="mt-24 pt-8 border-t border-gray-100 flex justify-between items-end">
        <div>
          <div className="text-[10px] uppercase font-bold text-gray-400 mb-1">Authorization</div>
          <div className="w-48 h-px bg-gray-300 mb-2"></div>
          <div className="text-[9px] text-gray-400 italic">Signature / Timestamp</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-bold text-gray-900 mb-1 tracking-tighter uppercase italic">iCover EPOS System</div>
          <div className="text-[9px] text-gray-400 tracking-widest uppercase">Certified Report • {now.toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  );
};

interface CashCounterProps {
  onClose: () => void;
  onConfirm: (total: number) => void;
  initialTotal?: number;
}

const CashCounter: React.FC<CashCounterProps> = ({ onClose, onConfirm }) => {
  const denominations = [
    { label: '€500', value: 500 },
    { label: '€200', value: 200 },
    { label: '€100', value: 100 },
    { label: '€50', value: 50 },
    { label: '€20', value: 20 },
    { label: '€10', value: 10 },
    { label: '€5', value: 5 },
    { label: '€2', value: 2 },
    { label: '€1', value: 1 },
    { label: '€0.50', value: 0.5 },
    { label: '€0.20', value: 0.2 },
    { label: '€0.10', value: 0.1 },
    { label: '€0.05', value: 0.05 },
    { label: '€0.02', value: 0.02 },
    { label: '€0.01', value: 0.01 },
  ];

  const [counts, setCounts] = useState<Record<number, number>>(
    denominations.reduce((acc, d) => ({ ...acc, [d.value]: 0 }), {})
  );

  const total = Object.entries(counts).reduce((sum, [val, count]) => sum + (Number(val) * count), 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--bg-card)] rounded shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] border border-[var(--border-base)]">
        <div className="p-4 border-b border-[var(--border-base)] flex justify-between items-center bg-[var(--bg-accent-subtle)]">
          <h3 className="text-sm font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
            <Calculator size={18} className="text-[var(--brand-primary)]" />
            Cash Drawer Counter
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted-more)] hover:text-[var(--text-main)] transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {denominations.map((d) => (
            <div key={d.value} className="flex items-center justify-between p-2 hover:bg-[var(--bg-hover)] rounded transition-colors border border-transparent">
              <span className="text-xs font-bold text-[var(--text-muted)] w-16">{d.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-[var(--text-muted-more)]">x</span>
                <input 
                  type="number" 
                  min="0"
                  value={counts[d.value] || ''}
                  onChange={(e) => setCounts(prev => ({ ...prev, [d.value]: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 bg-[var(--bg-app)] border border-[var(--border-base)] rounded text-right text-xs focus:ring-1 focus:ring-[var(--brand-primary)] outline-none text-[var(--text-main)]"
                />
                <span className="text-xs font-mono font-bold text-[var(--text-main)] w-24 text-right">
                  €{(counts[d.value] * d.value).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-[var(--bg-sidebar)] text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Total Counted</p>
            <p className="text-2xl font-black">€{total.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => onConfirm(total)}
            className="px-6 py-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white rounded font-bold transition-all shadow-lg shadow-black/20"
          >
            Apply Total
          </button>
        </div>
      </div>
    </div>
  );
};

export default function EndOfDay() {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(reportDate);
    d.setDate(d.getDate() - 1);
    setReportDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(reportDate);
    d.setDate(d.getDate() + 1);
    setReportDate(d.toISOString().split('T')[0]);
  };
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [invoicePayments, setInvoicePayments] = useState<Payment[]>([]);
  const [otherMovements, setOtherMovements] = useState<Payment[]>([]);
  const [startingBalance, setStartingBalance] = useState<number>(0);
  const [comments, setComments] = useState('');

  // Cash Counter Modal State
  const [showCashCounter, setShowCashCounter] = useState<'counted' | 'starting' | null>(null);

  // Counted values state
  const [countedValues, setCountedValues] = useState<Record<string, number>>({
    'Cash': 0,
    'Debit Card': 0,
    'Credit Card': 0,
    'Customer Deposit': 0,
    'Refunds': 0
  });

  const [printLayout, setPrintLayout] = useState<'thermal' | 'a4' | null>(null);
  const [showPrintOptions, setShowPrintOptions] = useState(false);

  useEffect(() => {
    if (printLayout) {
      const timer = setTimeout(() => {
        window.print();
        setPrintLayout(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [printLayout]);

  useEffect(() => {
    fetchEodData();
  }, [reportDate]);

  const fetchEodData = async () => {
    // Only show full loading if it's the very first time
    const isInitial = invoicePayments.length === 0 && otherMovements.length === 0;
    if (isInitial) setLoading(true);
    setIsRefreshing(true);
    
    try {
      const response = await fetch(`/api/reports/eod-data?date=${reportDate}`);
      const data = await response.json();
      setInvoicePayments(data.invoicePayments || []);
      setOtherMovements(data.otherMovements || []);
    } catch (error) {
      console.error('Error fetching EOD data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const updatePaymentMethod = async (paymentId: number, newMethod: string) => {
    // Optimistic Update
    const originalPayments = [...invoicePayments];
    setInvoicePayments(prev => prev.map(p => 
      p.id === paymentId ? { ...p, method: newMethod } : p
    ));

    try {
      const res = await fetch(`/api/invoices/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: newMethod })
      });
      if (!res.ok) {
        throw new Error('Failed to update');
      }
      // Optional: fetch fresh data to be sure, but optimistic is enough for immediate feedback
      // fetchEodData();
    } catch (error) {
      console.error('Error updating payment method:', error);
      setInvoicePayments(originalPayments); // Rollback on error
    }
  };

  const allPayments = [...invoicePayments, ...otherMovements];
  const totalSales = allPayments.reduce((sum, p) => sum + p.amount, 0);
  
  const cashFromInvoices = invoicePayments
    .filter(p => p.method.toLowerCase() === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);
    
  const cashFromDeposits = otherMovements
    .filter(p => p.method.toLowerCase() === 'cash')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalCashSales = cashFromInvoices + cashFromDeposits;
  const calculatedCashTotal = totalCashSales + startingBalance;
  const cashCounted = countedValues['Cash'] || 0;
  const cashDifference = cashCounted - calculatedCashTotal;

  const getCalculatedAmount = (type: string) => {
    if (type === 'Cash') return totalCashSales;
    
    if (type === 'Card') {
      return allPayments
        .filter(p => p.method.toLowerCase().includes('card'))
        .reduce((sum, p) => sum + p.amount, 0);
    }
    
    if (type === 'Wallet') {
      return allPayments
        .filter(p => p.method.toLowerCase() === 'wallet')
        .reduce((sum, p) => sum + p.amount, 0);
    }
    
    if (type === 'Refunds') {
      return allPayments
        .filter(p => p.amount < 0)
        .reduce((sum, p) => sum + p.amount, 0);
    }
    
    if (type === 'Other') {
      // Catch-all for any method that isn't Cash, Card, or Wallet
      return allPayments
        .filter(p => {
          const m = p.method.toLowerCase();
          return !m.includes('cash') && !m.includes('card') && m !== 'wallet';
        })
        .reduce((sum, p) => sum + p.amount, 0);
    }
    return 0;
  };

  const paymentTypes = ['Cash', 'Card', 'Wallet', 'Refunds', 'Other'];
  
  const summaries = paymentTypes.map(type => {
    const calculated = getCalculatedAmount(type);
    const counted = countedValues[type] || 0;
    return {
      payment_type: type,
      calculated,
      counted,
      difference: counted - calculated
    };
  });

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      const payload = {
        report_date: reportDate,
        starting_balance: startingBalance,
        cash_counted: cashCounted,
        calculated_cash: totalCashSales,
        difference: cashDifference,
        total_sales: totalSales,
        total_deposits: cashFromDeposits, // This might need a broader 'total manual movements' if needed
        total_cash_in_drawer: cashCounted,
        comments: comments,
        payment_summaries: summaries.map(s => ({
          payment_type: s.payment_type,
          calculated: s.calculated,
          counted: s.counted || 0,
          difference: s.difference
        }))
      };

      const res = await fetch('/api/reports/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save');
      
      setMessage({ type: 'success', text: 'End of day report saved successfully!' });
    } catch (error) {
      console.error('Error saving EOD:', error);
      setMessage({ type: 'error', text: 'Failed to save report.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[var(--brand-primary)] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[var(--text-muted)] font-medium tracking-wide">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] transition-colors duration-300">
      {/* Header bar to match user image */}
      <div className="sticky top-0 z-40 bg-[var(--bg-card)] border-b border-[var(--border-base)] shrink-0">
        <div className="flex items-center justify-between px-6 py-2.5">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-normal text-[var(--text-main)]">End of Day Report</h1>
            <div className="flex items-center bg-[#e67e22] text-white rounded shadow-sm overflow-hidden group">
              <button 
                onClick={handlePrevDay}
                className="px-2 py-2 hover:bg-black/10 transition-colors border-r border-white/20"
                title="Previous Day"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="relative px-5 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-black/5 transition-colors">
                <span className="font-bold text-sm tracking-tight">
                  {reportDate.split('-').reverse().join('-')}
                </span>
                <Calendar size={14} className="opacity-80" />
                <input 
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <button 
                onClick={handleNextDay}
                className="px-2 py-2 hover:bg-black/10 transition-colors border-l border-white/20"
                title="Next Day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isRefreshing && (
              <div className="flex items-center gap-2 px-3 py-1 bg-[var(--bg-zebra)] rounded-full animate-pulse border border-[var(--border-base)]">
                <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full animate-bounce"></div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Updating...</span>
              </div>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[var(--border-base)] rounded text-sm font-normal text-[var(--text-main)] hover:bg-[var(--bg-hover)] transition-all">
              <List size={16} />
              End of Day List
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowPrintOptions(!showPrintOptions)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-bold transition-all shadow-sm border ${
                  showPrintOptions 
                    ? 'bg-white border-[var(--brand-primary)] text-[var(--brand-primary)]' 
                    : 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]'
                }`}
              >
                <Printer size={16} />
                <span>Print</span>
                <motion.div
                  animate={{ rotate: showPrintOptions ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={14} />
                </motion.div>
              </button>

              <AnimatePresence>
                {showPrintOptions && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowPrintOptions(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-56 bg-white border border-[var(--border-base)] rounded-lg shadow-2xl z-50 py-1.5 overflow-hidden"
                    >
                      <div className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--bg-zebra)] mb-1">
                        Select Format
                      </div>
                      <button 
                        onClick={() => {
                          setPrintLayout('a4');
                          setShowPrintOptions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-main)] hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                          <FileText size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 leading-tight">Full Page Print</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Professional A4 Report</div>
                        </div>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setPrintLayout('thermal');
                          setShowPrintOptions(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[var(--text-main)] hover:bg-amber-50 transition-colors text-left group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors shadow-sm">
                          <Printer size={18} />
                        </div>
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 leading-tight">Thermal Print</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">80mm POS Receipt</div>
                        </div>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1400px] mx-auto p-6 space-y-6">
          {message && (
            <div className={`p-3 rounded flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
              message.type === 'success' ? 'bg-[var(--brand-success)]/10 text-[var(--brand-success)] border border-[var(--brand-success)]/20' : 'bg-[var(--brand-danger)]/10 text-[var(--brand-danger)] border border-[var(--brand-danger)]/20'
            }`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span className="text-xs font-bold">{message.text}</span>
              <button onClick={() => setMessage(null)} className="ml-auto underline text-[10px]">Dismiss</button>
            </div>
          )}

          {/* Reconciliation Table - Layout to match user image */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-sm overflow-hidden shadow-sm">
            <div className="divide-y divide-[var(--border-base)]">
              {/* Cash Counted Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[56px] bg-[var(--bg-card)] group hover:bg-[var(--bg-hover)] transition-colors">
                <div className="md:col-span-4 px-6 md:text-right text-sm font-normal text-[var(--text-muted)]">Cash Counted :</div>
                <div className="md:col-span-3 px-6"></div>
                <div className="md:col-span-5 px-6 py-2 flex flex-wrap md:flex-nowrap gap-3 justify-start md:justify-end items-center">
                  <div className="relative w-full md:w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)] text-xs">€</span>
                    <input 
                      type="number" 
                      value={countedValues['Cash']}
                      onChange={(e) => setCountedValues(prev => ({ ...prev, 'Cash': parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-amber-200 rounded-sm font-bold text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <button 
                    onClick={() => setShowCashCounter('counted')}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-[var(--border-base)] rounded-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all text-[10px] font-normal uppercase tracking-widest shadow-sm flex items-center gap-2"
                  >
                    <Calculator size={14} />
                    Cash Drawer Counter
                  </button>
                </div>
              </div>

              {/* Starting Balance Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[56px] bg-[var(--bg-card)] group hover:bg-[var(--bg-hover)] transition-colors">
                <div className="md:col-span-4 px-6 md:text-right text-sm font-normal text-[var(--text-muted)]">Starting Balance :</div>
                <div className="md:col-span-3 px-6"></div>
                <div className="md:col-span-5 px-6 py-2 flex flex-wrap md:flex-nowrap gap-3 justify-start md:justify-end items-center">
                  <div className="relative w-full md:w-40">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-more)] text-xs">€</span>
                    <input 
                      type="number" 
                      value={startingBalance}
                      onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 bg-white border border-amber-200 rounded-sm font-bold text-amber-700 focus:outline-none focus:ring-1 focus:ring-amber-500 text-right transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <button 
                    onClick={() => setShowCashCounter('starting')}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-[var(--border-base)] rounded-sm text-[var(--text-muted)] hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)] transition-all text-[10px] font-normal uppercase tracking-widest shadow-sm flex items-center gap-2"
                  >
                    <Calculator size={14} />
                    Cash Drawer Counter
                  </button>
                </div>
              </div>

              {/* Calculated Cash Row */}
              <div className="grid grid-cols-1 md:grid-cols-12 items-center min-h-[56px] bg-[var(--bg-zebra)]">
                <div className="md:col-span-4 px-6 md:text-right text-sm font-normal text-[var(--text-main)]">Calculated Cash :</div>
                <div className="md:col-span-3 px-6 md:text-right font-bold text-blue-600 bg-blue-50/50 h-full flex items-center justify-end text-sm">
                  €{calculatedCashTotal.toFixed(2)}
                </div>
                <div className="md:col-span-3 px-6 md:text-right font-bold text-amber-600 bg-amber-50/50 h-full flex items-center justify-end text-sm">
                  €{cashCounted.toFixed(2)}
                </div>
                <div className="md:col-span-2 py-4 px-6 bg-[var(--bg-accent-subtle)] md:text-right font-bold text-[var(--text-main)] text-sm border-l border-[var(--border-base)]">
                  {cashDifference >= 0 ? '' : '-' }€{Math.abs(cashDifference).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Payment Summaries Sub-Header */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-accent-subtle)] border-y border-[var(--border-base)] text-[10px] font-normal text-[var(--text-main)] uppercase tracking-widest">
                    <th className="py-3 px-6 text-left w-1/3">Payment Type</th>
                    <th className="py-3 px-6 text-right w-1/6 bg-blue-50/80 text-blue-700">Calculated</th>
                    <th className="py-3 px-6 text-right w-1/6 bg-amber-50/80 text-amber-700">Counted</th>
                    <th className="py-3 px-6 text-right w-1/6">Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-base)]">
                  {summaries.filter(s => s.payment_type !== 'Cash').map((s, idx) => (
                    <tr key={idx} className="bg-[var(--bg-card)] group hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-2.5 px-6 text-sm font-normal text-[var(--text-main)]">{s.payment_type}</td>
                      <td className={`py-2.5 px-6 text-right text-sm bg-blue-50/30 ${s.calculated !== 0 ? 'font-black text-blue-600' : 'font-normal text-[var(--text-muted-more)] opacity-40'}`}>
                        €{s.calculated.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-6 text-right bg-amber-50/30">
                        <div className="relative inline-block w-40">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-600/50 text-[10px]">€</span>
                          <input 
                            type="number" 
                            value={s.counted || ''}
                            onChange={(e) => setCountedValues(prev => ({ ...prev, [s.payment_type]: parseFloat(e.target.value) || 0 }))}
                            className={`w-full pl-6 pr-3 py-1 bg-white border border-amber-200 rounded-sm text-right text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${s.counted !== 0 ? 'font-black text-amber-700' : 'font-normal text-[var(--text-muted-more)] opacity-40'}`}
                            placeholder="0"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-6 w-48 bg-[var(--bg-accent-subtle)] text-right font-bold text-[var(--text-main)] text-sm border-l border-[var(--border-base)]">
                        {s.difference >= 0 ? '' : '-' }€{Math.abs(s.difference).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
                  <tr className="bg-[var(--bg-zebra)] text-[var(--text-main)] border-t-2 border-[var(--border-base)]">
                    <td className="py-4 px-6 text-right text-sm font-black uppercase tracking-widest opacity-60">Total :</td>
                    <td className="py-4 px-6 text-right font-black text-lg">
                      €{totalSales.toFixed(2)}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-lg">
                      €{( (cashCounted - startingBalance) + summaries.filter(s => s.payment_type !== 'Cash').reduce((sum, s) => sum + s.counted, 0) ).toFixed(2)}
                    </td>
                    <td className="py-4 px-6 w-48 bg-[var(--bg-accent-subtle)] text-right font-black text-lg border-l border-[var(--border-base)]">
                      {(( (cashCounted - startingBalance) + summaries.filter(s => s.payment_type !== 'Cash').reduce((sum, s) => sum + s.counted, 0) ) - totalSales) >= 0 ? '' : '-'}
                      €{Math.abs(( (cashCounted - startingBalance) + summaries.filter(s => s.payment_type !== 'Cash').reduce((sum, s) => sum + s.counted, 0) ) - totalSales).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex items-start gap-4">
            <label className="text-sm font-bold text-[var(--text-main)] pt-2 shrink-0">Comments :</label>
            <textarea 
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="flex-1 min-h-[80px] p-4 bg-[var(--bg-card)] border border-[var(--border-base)] rounded-sm text-sm text-[var(--text-main)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
              placeholder="Add your closing notes here..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-center pt-1">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[var(--brand-success)] hover:opacity-90 text-white font-bold py-1.5 px-10 rounded-sm text-sm transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save'}
            </button>
          </div>

          {/* Payment Information Table */}
          <div className="space-y-4">
            <h2 className="text-xl font-normal text-[var(--text-main)]">Payment Information</h2>
            <div className="bg-[var(--bg-card)] border border-[var(--border-base)] rounded-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-accent-subtle)] border-b border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] uppercase tracking-wider">
                    <th className="py-3 px-4 border-r border-[var(--border-base)]">User</th>
                    <th className="py-3 px-4 border-r border-[var(--border-base)]">Time</th>
                    <th className="py-3 px-4 border-r border-[var(--border-base)]">Invoice No.</th>
                    <th className="py-3 px-4 border-r border-[var(--border-base)]">Customer Name</th>
                    <th className="py-3 px-4 border-r border-[var(--border-base)]">Payment Type</th>
                    <th className="py-3 px-6 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-base)]">
                  {allPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[var(--text-muted)] text-sm italic">No payments recorded for this date.</td>
                    </tr>
                  ) : (
                    <>
                      {allPayments.map((payment, idx) => (
                        <tr 
                          key={idx} 
                          className={`transition-colors group hover:bg-[var(--bg-hover)] ${idx % 2 === 1 ? 'bg-[var(--bg-zebra)]' : 'bg-[var(--bg-card)]'}`}
                        >
                          <td className="py-2.5 px-4 text-sm text-[var(--text-muted)] border-r border-[var(--border-base)]">{payment.user_name || 'Staff'}</td>
                          <td className="py-2.5 px-4 text-sm text-[var(--text-muted)] border-r border-[var(--border-base)]">
                            {payment.paid_at ? new Date(payment.paid_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase() : '--:--'}
                          </td>
                          <td className="py-2.5 px-4 border-r border-[var(--border-base)]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--brand-primary)] font-bold text-xs hover:underline cursor-pointer transition-all flex items-center gap-1">
                                {payment.invoice_number || 'DEPOSIT'}
                                <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-all" />
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 px-4 text-sm text-[var(--text-muted)] border-r border-[var(--border-base)]">
                            {payment.customer_name || ''}
                          </td>
                          <td className="py-2.5 px-4 border-r border-[var(--border-base)]">
                            <select 
                              value={payment.method}
                              onChange={(e) => updatePaymentMethod(payment.id, e.target.value)}
                              className="bg-transparent text-sm text-[var(--text-main)] border border-[var(--border-base)] rounded px-2 py-1 focus:ring-0 outline-none cursor-pointer hover:border-[var(--brand-primary)] transition-colors w-full"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Debit Card">Debit Card</option>
                              <option value="Credit Card">Credit Card</option>
                              <option value="Wallet">Wallet</option>
                              <option value="Other">Other</option>
                            </select>
                          </td>
                          <td className={`py-2.5 px-6 text-right text-sm ${payment.amount !== 0 ? 'font-black text-[var(--text-main)]' : 'font-normal text-[var(--text-muted-more)] opacity-40'}`}>
                            €{payment.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {/* Total Footer for Payment Information */}
                      <tr className="bg-[var(--bg-accent-subtle)] border-t-2 border-[var(--border-base)]">
                        <td colSpan={5} className="py-3 px-6 text-right text-xs font-black uppercase tracking-widest text-[var(--text-main)]">
                          Total Payments :
                        </td>
                        <td className="py-3 px-6 text-right font-black text-blue-600 text-base">
                          €{allPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Counter Modal */}
      {showCashCounter && (
        <CashCounter 
          onClose={() => setShowCashCounter(null)}
          onConfirm={(total) => {
            if (showCashCounter === 'counted') {
              setCountedValues(prev => ({ ...prev, 'Cash': total }));
            } else {
              setStartingBalance(total);
            }
            setShowCashCounter(null);
          }}
        />
      )}
      {/* Print Layouts (Hidden from screen, only visible in print mode) */}
      {printLayout === 'thermal' && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <EndOfDayThermal 
            reportDate={reportDate}
            startingBalance={startingBalance}
            totalSales={totalSales}
            cashCounted={cashCounted}
            calculatedCash={calculatedCashTotal}
            difference={cashDifference}
            summaries={summaries}
            allPayments={allPayments}
            comments={comments}
          />
        </div>
      )}

      {printLayout === 'a4' && (
        <div className="hidden print:block fixed inset-0 z-[9999] bg-white">
          <EndOfDayA4 
            reportDate={reportDate}
            startingBalance={startingBalance}
            totalSales={totalSales}
            cashCounted={cashCounted}
            calculatedCash={calculatedCashTotal}
            difference={cashDifference}
            summaries={summaries}
            allPayments={allPayments}
            comments={comments}
          />
        </div>
      )}
    </div>
  );
}
