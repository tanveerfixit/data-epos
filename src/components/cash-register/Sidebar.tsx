import React from 'react';
import { CustomerSelector } from './CustomerSelector';
import { TotalsPanel } from './TotalsPanel';
import { PaymentPanel } from './PaymentPanel';
import { CheckoutActions } from './CheckoutActions';
import { Customer } from '../../types';
import { PaymentEntry } from './types';

interface SidebarProps {
  selectedCustomer: Customer | null;
  customerSearch: string;
  setCustomerSearch: (query: string) => void;
  customerResults: Customer[];
  onSelectCustomer: (customer: Customer) => void;
  onClearCustomer: () => void;
  onOpenNewCustomerModal: () => void;
  
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  
  addedPayments: PaymentEntry[];
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  onAddPayment: () => void;
  onRemovePayment: (index: number) => void;
  remainingAmount: number;
  
  onCheckout: () => void;
  onClearCart: () => void;
  isCartEmpty: boolean;
  isPaymentComplete: boolean;
  availableMethods: string[];
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <div className="w-[380px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
      <CustomerSelector 
        selectedCustomer={props.selectedCustomer}
        customerSearch={props.customerSearch}
        setCustomerSearch={props.setCustomerSearch}
        customerResults={props.customerResults}
        onSelectCustomer={props.onSelectCustomer}
        onClearCustomer={props.onClearCustomer}
        onOpenNewCustomerModal={props.onOpenNewCustomerModal}
      />
      
      <TotalsPanel 
        subtotal={props.subtotal}
        tax={props.tax}
        discount={props.discount}
        total={props.total}
      />
      
      <PaymentPanel 
        addedPayments={props.addedPayments}
        paymentMethod={props.paymentMethod}
        setPaymentMethod={props.setPaymentMethod}
        paymentAmount={props.paymentAmount}
        setPaymentAmount={props.setPaymentAmount}
        onAddPayment={props.onAddPayment}
        onRemovePayment={props.onRemovePayment}
        remainingAmount={props.remainingAmount}
        customerBalance={props.selectedCustomer?.wallet_balance || 0}
        availableMethods={props.availableMethods}
      />
      
      <CheckoutActions 
        onCheckout={props.onCheckout}
        onClearCart={props.onClearCart}
        isCartEmpty={props.isCartEmpty}
        isPaymentComplete={props.isPaymentComplete}
      />
    </div>
  );
};
