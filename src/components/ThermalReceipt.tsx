import React from 'react';
import { Invoice, InvoiceItem, Customer } from '../types';
import { ThermalPrinterSettings, CompanyInfo } from '../hooks/useThermalSettings';

interface Props {
  invoice: Invoice & { items: InvoiceItem[], customer?: Customer };
  settings?: ThermalPrinterSettings | null;
  company?: CompanyInfo | null;
}

export default function ThermalReceipt({ invoice, settings, company }: Props) {
  const now = new Date();

  if (!settings || !company) {
    return (
      <div className="p-4 text-center text-slate-400 text-xs font-mono">
        Loading receipt settings...
      </div>
    );
  }

  // Split address if it's very long to maintain clean alignment
  const addressParts = company.address.split(',').map(s => s.trim());
  const addressLine1 = addressParts.slice(0, 3).join(', ');
  const addressLine2 = addressParts.slice(3).join(', ');

  return (
    <div 
      className="thermal-receipt bg-white text-black mx-auto font-mono" 
      id="thermal-receipt"
      style={{ 
        width: '72mm',
        maxWidth: '72mm',
        lineHeight: '1.2',
        padding: '1mm 2mm',
        boxSizing: 'border-box',
        fontSize: '11px',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          body * { visibility: hidden; }
          #thermal-receipt, #thermal-receipt * { visibility: visible; }
          #thermal-receipt {
            position: absolute; left: 0; top: 0;
            width: 72mm; padding: 2mm;
            background: white !important;
            color: black !important;
          }
        }
        .receipt-separator { border-top: 1px dashed #000; margin: 4px 0; }
        .flex-between { display: flex; justify-content: space-between; }
        .text-bold { font-weight: bold; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
      `}} />
      
      {/* Header */}
      <div className="text-center mb-2">
        {settings.show_business_name && <div className="text-bold" style={{ fontSize: '14px', textTransform: 'uppercase' }}>{company.name}</div>}
        {settings.show_business_address && (
          <div className="mt-0.5">
            <div>{addressLine1}{addressParts.length > 3 ? ',' : ''}</div>
            {addressLine2 && <div>{addressLine2}</div>}
          </div>
        )}
        {settings.show_business_phone && <div>Tel: {company.phone}</div>}
        {settings.show_business_email && <div>{company.email}</div>}
      </div>
      
      <div className="receipt-separator" />
      
      {/* Invoice Info */}
      <div className="mb-2">
        {settings.show_date && <div className="flex-between"><span>Date:</span> <span>{new Date(invoice.created_at || now).toLocaleString()}</span></div>}
        {settings.show_invoice_number && <div className="flex-between"><span>Invoice:</span> <span>{invoice.invoice_number}</span></div>}
        {settings.show_customer_info && <div className="flex-between"><span>Customer:</span> <span>{invoice.customer?.name || 'Walk-in'}</span></div>}
      </div>
      
      <div className="receipt-separator" />
      
      {/* Items Table */}
      {settings.show_items_table && (
        <div className="mb-2">
          <div className="flex-between text-bold mb-1">
            <span style={{ width: '60%' }}>Item</span>
            <span style={{ width: '10%', textAlign: 'center' }}>Qty</span>
            <span style={{ width: '30%', textAlign: 'right' }}>Price</span>
          </div>
          {(invoice.items || []).map((item, idx) => (
            <div key={idx} className="flex-between mb-0.5">
              <span style={{ width: '60%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.product_name}
                {item.imei && <div style={{ fontSize: '9px', opacity: 0.8 }}>IMEI: {item.imei}</div>}
              </span>
              <span style={{ width: '10%', textAlign: 'center' }}>{item.quantity}</span>
              <span style={{ width: '30%', textAlign: 'right' }}>€{(item.total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="receipt-separator" />
      
      {/* Totals */}
      {settings.show_totals && (
        <div className="mb-2">
          <div className="flex-between">
            <span>Subtotal:</span>
            <span>€{invoice.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex-between text-bold" style={{ fontSize: '13px', marginTop: '2px' }}>
            <span>TOTAL:</span>
            <span>€{invoice.grand_total.toFixed(2)}</span>
          </div>
          {(invoice.paid_amount || 0) > 0 && (
            <div className="flex-between">
              <span>PAID:</span>
              <span>€{(invoice.paid_amount || 0).toFixed(2)}</span>
            </div>
          )}
          {(invoice.due_amount || 0) > 0 && (
            <div className="flex-between text-bold" style={{ color: '#000' }}>
              <span>DUE:</span>
              <span>€{(invoice.due_amount || 0).toFixed(2)}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Payments */}
      {invoice.payments && invoice.payments.length > 0 && (
        <div className="mb-2">
          <div className="text-bold">Payment:</div>
          {invoice.payments.map((p, idx) => (
            <div key={idx} className="flex-between">
              <span>{p.method}</span>
              <span>€{(p.amount || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Footer */}
      <div className="text-center mt-4">
        {settings.show_footer && <div style={{ fontStyle: 'italic' }}>{settings.footer_text}</div>}
        <div style={{ fontSize: '9px', marginTop: '8px', opacity: 0.7 }}>
          Powered by EPOS
        </div>
      </div>
    </div>
  );
}

