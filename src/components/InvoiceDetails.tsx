import { useState, useEffect, useRef } from 'react';
import { List, Printer, ChevronDown, User, Info, Plus, ExternalLink, FileText, Mail } from 'lucide-react';
import { Invoice, InvoiceItem, Customer } from '../types';
import ThermalReceipt from './ThermalReceipt';
import { useThermalSettings } from '../hooks/useThermalSettings';

interface Props {
  invoiceId: number;
  onBack: () => void;
  onSelectCustomer?: (id: number) => void;
}

export default function InvoiceDetails({ invoiceId, onBack, onSelectCustomer }: Props) {
  const [invoice, setInvoice] = useState<(Invoice & { items: InvoiceItem[], customer?: Customer }) | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Debit Card'>('Cash');
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printMode, setPrintMode] = useState<'thermal' | 'a4' | null>(null);
  const printMenuRef = useRef<HTMLDivElement>(null);
  const { settings, company, loading: settingsLoading } = useThermalSettings();

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(setInvoice);
  }, [invoiceId]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!invoice) return <div className="p-8">Loading...</div>;

  const handleThermalPrint = () => {
    setShowPrintMenu(false);
    if (settingsLoading) {
      alert('Loading printer settings, please wait a moment...');
      return;
    }
    setPrintMode('thermal');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 100);
  };

  const handleA4Print = () => {
    setShowPrintMenu(false);
    setPrintMode('a4');
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 500);
    }, 100);
  };

  const handleEmailInvoice = () => {
    setShowPrintMenu(false);
    const email = invoice.customer?.email;
    if (!email) {
      alert('No email address found for this customer.');
      return;
    }
    const subject = encodeURIComponent(`Invoice ${invoice.invoice_number}`);
    const body = encodeURIComponent(`Dear ${invoice.customer?.name || 'Customer'},\n\nPlease find your invoice ${invoice.invoice_number} attached.\n\nTotal: €${invoice.grand_total.toFixed(2)}\n\nThank you for your business!`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleRefund = async () => {
    const res = await fetch(`/api/invoices/${invoiceId}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: refundMethod })
    });
    if (res.ok) {
      alert('Refund created successfully');
      setShowRefundModal(false);
      fetch(`/api/invoices/${invoiceId}`)
        .then(res => res.json())
        .then(setInvoice);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  return (
    <div className="flex flex-col h-full bg-[#f4f7f9] overflow-auto">
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-medium text-slate-700">View Invoice - {invoice.invoice_number}</h2>
          {invoice.status === 'void' && (
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-red-200">
              Void / Refunded
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onBack}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm"
          >
            <List size={16} />
            Sales Invoices
          </button>
          
          {/* Print Dropdown */}
          <div className="relative" ref={printMenuRef}>
            <button 
              onClick={() => setShowPrintMenu(!showPrintMenu)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded text-sm flex items-center gap-2 transition-all shadow-sm"
            >
              <Printer size={16} />
              Print
              <ChevronDown size={14} className={`transition-transform ${showPrintMenu ? 'rotate-180' : ''}`} />
            </button>

            {showPrintMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 overflow-hidden">
                <button
                  onClick={handleThermalPrint}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  <Printer size={15} className="text-indigo-500" />
                  <span className="font-medium">Thermal Print</span>
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleA4Print}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                >
                  <FileText size={15} className="text-blue-500" />
                  <span className="font-medium">A4 Print</span>
                </button>
                <div className="border-t border-slate-100" />
                <button
                  onClick={handleEmailInvoice}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  <Mail size={15} className="text-emerald-500" />
                  <span className="font-medium">Email Invoice</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Customer Info */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#e9ecef] px-4 py-2 border-b border-slate-200 flex items-center gap-2">
              <User size={16} className="text-slate-600" />
              <h3 className="text-sm font-bold text-slate-700">Customer info</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-24 font-bold text-slate-700">Customer:</span>
                {invoice.customer_id ? (
                  <button 
                    onClick={() => onSelectCustomer?.(invoice.customer_id!)}
                    className="text-blue-500 flex items-center gap-1 hover:underline"
                  >
                    {invoice.customer?.name}
                    <ExternalLink size={12} />
                  </button>
                ) : (
                  <span className="text-slate-500">Unassigned</span>
                )}
              </div>
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-24 font-bold text-slate-700">Email:</span>
                <span className="text-slate-600">{invoice.customer?.email || ''}</span>
              </div>
              <div className="flex">
                <span className="w-24 font-bold text-slate-700">Phone No.:</span>
                <span className="text-slate-600">{invoice.customer?.phone || ''}</span>
              </div>
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
            <div className="bg-[#e9ecef] px-4 py-2 border-b border-slate-200 flex items-center gap-2">
              <Info size={16} className="text-slate-600" />
              <h3 className="text-sm font-bold text-slate-700">Order Info</h3>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-32 font-bold text-slate-700">Invoice No.</span>
                <span className="text-slate-600">{invoice.invoice_number}</span>
              </div>
              <div className="flex border-b border-slate-100 pb-2">
                <span className="w-32 font-bold text-slate-700">Sales Person:</span>
                <span className="text-slate-600">Phone Lab</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700">Date:</span>
                <span className="text-slate-600">{formatDate(invoice.created_at)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#e9ecef] border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-300 w-12 text-center">#</th>
                <th className="px-4 py-2 border-r border-slate-300">Description</th>
                <th className="px-4 py-2 border-r border-slate-300 text-center w-32">Time/Qty</th>
                <th className="px-4 py-2 border-r border-slate-300 text-right w-32">Unit Price</th>
                <th className="px-4 py-2 text-right w-32">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-200 text-sm">
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500">{idx + 1}</td>
                  <td className="px-4 py-2 border-r border-slate-200">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-800">{item.product_name}</span>
                      {item.imei && (
                        <span className="text-blue-500 flex items-center gap-1">
                          ({item.imei})
                          <ExternalLink size={12} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right text-slate-600">€{item.price.toFixed(2)}</td>
                  <td className="px-4 py-2 text-right text-slate-800 font-medium">€{item.total.toFixed(2)}</td>
                </tr>
              ))}
              
              {/* Totals */}
              <tr className="bg-white text-sm">
                <td colSpan={3} className="border-r border-slate-200"></td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-slate-700">Taxable Total :</td>
                <td className="px-4 py-2 text-right font-bold text-slate-900">€{invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="bg-white text-sm">
                <td colSpan={3} className="border-r border-slate-200"></td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-slate-700">Vat0 (0%) :</td>
                <td className="px-4 py-2 text-right font-bold text-slate-900">€{invoice.tax_total.toFixed(2)}</td>
              </tr>
              <tr className="bg-white text-sm">
                <td colSpan={3} className="border-r border-slate-200"></td>
                <td className="px-4 py-2 border-r border-slate-200 text-right font-bold text-slate-700">Grand Total :</td>
                <td className="px-4 py-2 text-right font-bold text-slate-900">€{invoice.grand_total.toFixed(2)}</td>
              </tr>
              
              {/* Payment Info */}
              {invoice.payments && invoice.payments.length > 0 ? (
                invoice.payments.map((payment, idx) => (
                  <tr key={idx} className="bg-white text-xs text-slate-500 italic">
                    <td colSpan={3} className="border-r border-slate-200"></td>
                    <td className="px-4 py-2 border-r border-slate-200 text-right">
                      {formatDate(payment.paid_at)} {formatTime(payment.paid_at)} {payment.method} Payment
                    </td>
                    <td className="px-4 py-2 text-right">€{payment.amount.toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white text-xs text-slate-500 italic">
                  <td colSpan={3} className="border-r border-slate-200"></td>
                  <td className="px-4 py-2 border-r border-slate-200 text-right">
                    {formatDate(invoice.created_at)} {formatTime(invoice.created_at)} {invoice.payment_method} Payment
                  </td>
                  <td className="px-4 py-2 text-right">€{invoice.grand_total.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end">
          {invoice.status !== 'void' ? (
            <button 
              onClick={() => setShowRefundModal(true)}
              className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-1.5 px-6 rounded text-sm shadow-sm transition-all"
            >
              Create Refund
            </button>
          ) : (
            <div className="text-sm font-bold text-red-500 bg-red-50 px-4 py-2 rounded border border-red-100">
              This invoice has been refunded.
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden">
          <div className="bg-[#e9ecef] px-4 py-2 border-b border-slate-200 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Activity Log</h3>
            <div className="flex gap-2">
              <select className="bg-white border border-slate-300 rounded px-2 py-1 text-xs text-slate-600 focus:outline-none">
                <option>All Activities</option>
              </select>
              <button className="bg-white border border-slate-300 rounded px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Add New Note
              </button>
            </div>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-2 border-r border-slate-200 w-24">Date</th>
                <th className="px-4 py-2 border-r border-slate-200 w-24">Time</th>
                <th className="px-4 py-2 border-r border-slate-200 w-40">User</th>
                <th className="px-4 py-2 border-r border-slate-200 w-48">Activity</th>
                <th className="px-4 py-2">Details</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {invoice.activities && invoice.activities.length > 0 ? (
                invoice.activities.map((activity) => (
                  <tr key={activity.id} className="border-b border-slate-100 bg-[#f8f9fa] hover:bg-slate-50">
                    <td className="px-4 py-2 border-r border-slate-200">{formatDate(activity.created_at)}</td>
                    <td className="px-4 py-2 border-r border-slate-200">{formatTime(activity.created_at)}</td>
                    <td className="px-4 py-2 border-r border-slate-200">{activity.user_name || 'System'}</td>
                    <td className="px-4 py-2 border-r border-slate-200 font-bold">{activity.activity}</td>
                    <td className="px-4 py-2">{activity.details}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400 italic">
                    No activities recorded for this invoice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="p-2 bg-white border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
            <div className="flex items-center gap-2">
              <select className="bg-white border border-slate-300 rounded px-1 py-0.5 focus:outline-none">
                <option>auto</option>
              </select>
              <span className="font-bold">1-1/1</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-50">«</button>
              <button className="px-2 py-0.5 bg-[#3498db] text-white rounded font-bold">1</button>
              <button className="px-1.5 py-0.5 border border-slate-300 rounded hover:bg-slate-50">»</button>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">Create Refund</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="rotate-45" size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Are you sure you want to create a refund for invoice <span className="font-bold">{invoice.invoice_number}</span>?</p>
              <div className="text-2xl font-bold text-center text-red-500">
                €{invoice.grand_total.toFixed(2)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Refund Method</label>
                <select 
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full border border-slate-300 rounded py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Debit Card">Debit Card</option>
                </select>
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 border border-slate-300 rounded font-bold text-slate-700 hover:bg-white"
              >
                Cancel
              </button>
              <button 
                onClick={handleRefund}
                className="px-6 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700"
              >
                Confirm Refund
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Print Container - only visible when printing in thermal mode */}
      {printMode === 'thermal' && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
          <ThermalReceipt invoice={invoice} settings={settings} company={company} />
        </div>
      )}

      {/* A4 Print Container - only visible when printing in A4 mode */}
      {printMode === 'a4' && (
        <div className="hidden print:block fixed inset-0 bg-white z-[9999] p-8">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              @page { size: A4; margin: 15mm; }
              body * { visibility: hidden; }
              .a4-print-container, .a4-print-container * { visibility: visible; }
              .a4-print-container { position: fixed; inset: 0; padding: 0; }
            }
          `}} />
          <div className="a4-print-container max-w-2xl mx-auto font-sans">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{company?.name}</h1>
                <p className="text-slate-500">{company?.address}</p>
                <p className="text-slate-500">{company?.phone}</p>
                <p className="text-slate-500">{company?.email}</p>
              </div>
              <div className="text-right">
                <h2 className="text-2xl font-bold text-indigo-600">INVOICE</h2>
                <p className="text-slate-600 font-medium">{invoice.invoice_number}</p>
                <p className="text-slate-500 text-sm">{formatDate(invoice.created_at)}</p>
              </div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 rounded">
              <p className="text-xs font-bold text-slate-500 uppercase mb-1">Bill To</p>
              <p className="font-bold text-slate-800">{invoice.customer?.name || 'Walk-in Customer'}</p>
              {invoice.customer?.email && <p className="text-slate-600 text-sm">{invoice.customer.email}</p>}
              {invoice.customer?.phone && <p className="text-slate-600 text-sm">{invoice.customer.phone}</p>}
            </div>

            <table className="w-full mb-6 text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-300">
                  <th className="text-left py-2 font-bold text-slate-700">Description</th>
                  <th className="text-center py-2 font-bold text-slate-700 w-16">Qty</th>
                  <th className="text-right py-2 font-bold text-slate-700 w-24">Unit Price</th>
                  <th className="text-right py-2 font-bold text-slate-700 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100">
                    <td className="py-2 text-slate-800">{item.product_name}{item.imei ? ` (${item.imei})` : ''}</td>
                    <td className="py-2 text-center text-slate-600">{item.quantity}</td>
                    <td className="py-2 text-right text-slate-600">€{item.price.toFixed(2)}</td>
                    <td className="py-2 text-right font-medium text-slate-800">€{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end">
              <div className="w-56 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Subtotal:</span><span>€{invoice.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Tax (0%):</span><span>€{invoice.tax_total.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-base border-t border-slate-300 pt-2 mt-2">
                  <span>Grand Total:</span><span>€{invoice.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-6 border-t border-slate-200 text-center text-xs text-slate-400">
              Thank you for your business!
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
