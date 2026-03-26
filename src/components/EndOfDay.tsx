import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  List, 
  Save, 
  ChevronDown, 
  FileText, 
  Euro,
  Calculator,
  AlertCircle,
  CheckCircle2,
  ArrowRightLeft,
  X,
  ExternalLink
} from 'lucide-react';
import { Payment, ClosingReport, ClosingReportPayment } from '../types';

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calculator size={20} className="text-blue-500" />
            Cash Drawer Counter
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {denominations.map((d) => (
            <div key={d.value} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded transition-colors border border-transparent hover:border-slate-100">
              <span className="text-sm font-bold text-slate-700 w-16">{d.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">x</span>
                <input 
                  type="number" 
                  min="0"
                  value={counts[d.value] || ''}
                  onChange={(e) => setCounts(prev => ({ ...prev, [d.value]: parseInt(e.target.value) || 0 }))}
                  className="w-20 px-2 py-1 border border-slate-300 rounded text-right text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <span className="text-sm font-mono font-bold text-slate-600 w-24 text-right">
                  €{(counts[d.value] * d.value).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Counted</p>
            <p className="text-2xl font-black">€{total.toFixed(2)}</p>
          </div>
          <button 
            onClick={() => onConfirm(total)}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold transition-all shadow-lg shadow-blue-900/20"
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
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetchEodData();
  }, [reportDate]);

  const fetchEodData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/eod-data?date=${reportDate}`);
      const data = await response.json();
      setInvoicePayments(data.invoicePayments || []);
      setOtherMovements(data.otherMovements || []);
    } catch (error) {
      console.error('Error fetching EOD data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePaymentMethod = async (paymentId: number, newMethod: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: newMethod })
      });
      if (res.ok) {
        fetchEodData();
      }
    } catch (error) {
      console.error('Error updating payment method:', error);
    }
  };

  // Calculation Logic
  const getCalculatedAmount = (type: string) => {
    if (type === 'Cash') {
      return invoicePayments
        .filter(p => p.method.toLowerCase() === 'cash')
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Debit Card') {
      return invoicePayments
        .filter(p => p.method.toLowerCase().includes('debit'))
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Credit Card') {
      return invoicePayments
        .filter(p => p.method.toLowerCase().includes('credit'))
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Customer Deposit') {
      return otherMovements
        .filter(p => p.type === 'deposit')
        .reduce((sum, p) => sum + p.amount, 0);
    }
    if (type === 'Refunds') {
      return invoicePayments
        .filter(p => p.amount < 0)
        .reduce((sum, p) => sum + p.amount, 0);
    }
    return 0;
  };

  const paymentTypes = ['Cash', 'Debit Card', 'Credit Card', 'Customer Deposit', 'Refunds'];
  
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

  const totalSales = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
  const totalDeposits = otherMovements.filter(p => p.type === 'deposit').reduce((sum, p) => sum + p.amount, 0);
  
  const cashSales = getCalculatedAmount('Cash');
  const calculatedCashTotal = cashSales + totalDeposits + startingBalance;
  const cashCounted = countedValues['Cash'] || 0;
  const cashDifference = cashCounted - calculatedCashTotal;

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    const report: ClosingReport = {
      branch_id: 1,
      user_id: 1,
      report_date: reportDate,
      starting_balance: startingBalance,
      cash_counted: cashCounted,
      calculated_cash: calculatedCashTotal,
      difference: cashDifference,
      total_sales: totalSales,
      total_deposits: totalDeposits,
      total_cash_in_drawer: cashCounted,
      comments,
      payment_summaries: summaries
    };

    try {
      const response = await fetch('/api/reports/eod', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'End of Day report saved successfully!' });
      } else {
        throw new Error('Failed to save report');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving report: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium tracking-wide">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#f4f7f9] overflow-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-medium text-slate-700">End of Day Report</h1>
          <div className="bg-orange-500 text-white px-3 py-1 rounded text-sm font-bold">
            {reportDate.split('-').reverse().join('-')}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
            <List size={16} />
            End of Day List
          </button>
          <div className="relative group">
            <button 
              className="flex items-center gap-2 px-4 py-1.5 bg-cyan-400 text-white rounded text-sm font-bold hover:bg-cyan-500 transition-all shadow-sm"
            >
              <Printer size={16} />
              Print
              <ChevronDown size={14} />
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Full Page Printer</button>
              <button onClick={() => window.print()} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Thermal Printer</button>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded flex items-center gap-3 animate-in slide-in-from-top-2 duration-300 ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Cash Summary Section */}
      <div className="bg-white rounded border border-slate-300 overflow-hidden mb-8 shadow-sm">
        <div className="p-0">
          <div className="divide-y divide-slate-200">
            {/* Cash Counted Row */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-4 py-3 px-4 text-right bg-slate-50 border-r border-slate-200">
                <span className="text-sm font-medium text-slate-600">Cash Counted :</span>
              </div>
              <div className="col-span-6 py-3 px-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={countedValues['Cash']}
                    onChange={(e) => setCountedValues(prev => ({ ...prev, 'Cash': parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <button 
                    onClick={() => setShowCashCounter('counted')}
                    className="shrink-0 px-4 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Cash Drawer Counter
                  </button>
                </div>
              </div>
            </div>

            {/* Starting Balance Row */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-4 py-3 px-4 text-right bg-slate-50 border-r border-slate-200">
                <span className="text-sm font-medium text-slate-600">Starting Balance :</span>
              </div>
              <div className="col-span-6 py-3 px-4">
                <div className="flex items-center gap-4">
                  <input 
                    type="number" 
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                  <button 
                    onClick={() => setShowCashCounter('starting')}
                    className="shrink-0 px-4 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
                  >
                    Cash Drawer Counter
                  </button>
                </div>
              </div>
            </div>

            {/* Calculated Cash Row */}
            <div className="grid grid-cols-12 items-center">
              <div className="col-span-4 py-3 px-4 text-right bg-slate-50 border-r border-slate-200">
                <span className="text-sm font-medium text-slate-600">Calculated Cash :</span>
              </div>
              <div className="col-span-8 grid grid-cols-3 divide-x divide-slate-200 h-full">
                <div className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                  €{calculatedCashTotal.toFixed(2)}
                </div>
                <div className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                  €{cashCounted.toFixed(2)}
                </div>
                <div className={`py-3 px-4 text-right font-mono font-bold bg-slate-100 ${
                  cashDifference === 0 ? 'text-slate-500' : 
                  cashDifference > 0 ? 'text-emerald-600' : 
                  'text-red-600'
                }`}>
                  {cashDifference >= 0 ? '+' : ''}€{cashDifference.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary Table */}
          <div className="border-t border-slate-300">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#e9ecef] border-b border-slate-300">
                  <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Type</th>
                  <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Calculated</th>
                  <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Counted</th>
                  <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {summaries.filter(s => s.payment_type !== 'Cash').map((s, idx) => (
                  <tr key={idx}>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{s.payment_type}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-600">€{s.calculated.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <input 
                        type="number" 
                        value={s.counted || ''}
                        onChange={(e) => setCountedValues(prev => ({ ...prev, [s.payment_type]: parseFloat(e.target.value) || 0 }))}
                        className="w-full max-w-[200px] px-3 py-1.5 bg-white border border-slate-300 rounded text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-bold bg-slate-100 ${
                      s.difference === 0 ? 'text-slate-500' : 
                      s.difference > 0 ? 'text-emerald-600' : 
                      'text-red-600'
                    }`}>
                      {s.difference >= 0 ? '+' : ''}€{s.difference.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50 font-black border-t-2 border-slate-300">
                  <td className="py-3 px-4 text-right text-sm uppercase tracking-wider text-slate-600">Total :</td>
                  <td className="py-3 px-4 text-right font-mono">€{(summaries.reduce((sum, s) => sum + s.calculated, 0) + startingBalance).toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-mono">€{(summaries.reduce((sum, s) => sum + s.counted, 0)).toFixed(2)}</td>
                  <td className={`py-3 px-4 text-right font-mono ${
                    (summaries.reduce((sum, s) => sum + s.difference, 0) - startingBalance) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    €{(summaries.reduce((sum, s) => sum + s.difference, 0) - startingBalance).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Comments */}
          <div className="p-4 border-t border-slate-300 bg-white">
            <div className="flex gap-4">
              <span className="text-sm font-bold text-slate-700 pt-2 w-32 text-right">Comments :</span>
              <textarea 
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="flex-1 h-20 p-3 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                placeholder="Add any notes here..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center mb-8">
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-10 py-2 bg-emerald-500 text-white rounded font-bold hover:bg-emerald-600 transition-all shadow-md disabled:opacity-50"
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Save'
          )}
        </button>
      </div>

      {/* Payment Information Section */}
      <div className="space-y-0">
        <h2 className="text-lg font-medium text-slate-700 mb-4">Payment Information</h2>
        <div className="bg-white rounded border border-slate-300 overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300">
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-300">User</th>
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-300">Time</th>
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-300">Invoice No.</th>
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-300">Customer Name</th>
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider border-r border-slate-300">Payment Type</th>
                <th className="py-2 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {invoicePayments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium italic">No invoice payments found for this date.</td>
                </tr>
              ) : (
                invoicePayments.map((payment, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-4 text-sm text-slate-600 border-r border-slate-200">{payment.user_name || 'Phone Lab'}</td>
                    <td className="py-2 px-4 text-sm text-slate-600 border-r border-slate-200">{new Date(payment.paid_at!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}</td>
                    <td className="py-2 px-4 border-r border-slate-200">
                      <div className="flex items-center gap-1">
                        <span className="text-blue-600 font-medium text-sm underline cursor-pointer">
                          s{payment.invoice_number}
                        </span>
                        <ExternalLink size={12} className="text-blue-600" />
                      </div>
                    </td>
                    <td className="py-2 px-4 text-sm text-slate-600 border-r border-slate-200">{payment.customer_name || 'Unassigned'}</td>
                    <td className="py-2 px-4 border-r border-slate-200">
                      <select 
                        value={payment.method}
                        onChange={(e) => updatePaymentMethod(payment.id, e.target.value)}
                        className="w-full bg-transparent border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="Cash">Cash</option>
                        <option value="Debit Card">Debit Card</option>
                        <option value="Credit Card">Credit Card</option>
                        <option value="Wallet">Wallet</option>
                      </select>
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-bold text-slate-700">€{payment.amount.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  );
}
