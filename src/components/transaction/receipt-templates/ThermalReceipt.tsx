// src/components/transaction/receipt-templates/ThermalReceipt.tsx
import React from 'react';
import type { DatabaseReadyTransaction } from '@/lib/pos-data-transformer';
import { useLanguage } from '@/context/LanguageContext';
import type { Company } from '@prisma/client';

interface ThermalReceiptProps {
  data: DatabaseReadyTransaction;
  company?: Company | null;
  originalTransaction?: DatabaseReadyTransaction | null;
  showAsGiftReceipt?: boolean; 
}

const Line = () => <div className="border-t border-dashed border-black my-1"></div>;

export function ThermalReceipt({ data, company, originalTransaction, showAsGiftReceipt: showAsGiftReceiptProp }: ThermalReceiptProps) {
  const { transactionHeader, transactionLines, appliedDiscountsLog, customerDetails, paymentDetails } = data;
  const { t } = useLanguage();

  const showAsGiftReceipt = showAsGiftReceiptProp !== undefined
    ? showAsGiftReceiptProp
    : (transactionHeader.isGiftReceipt ?? false);

  const finalTotalToShow = transactionHeader.finalTotal;
  const isRefund = transactionHeader.status === 'refund';
  const finalCashChange = paymentDetails.paidAmount - finalTotalToShow;
  const originalPaidAmountForRefundContext = originalTransaction?.paymentDetails.paidAmount;
  const shouldShowPaymentDetails = !showAsGiftReceipt || (showAsGiftReceipt && paymentDetails.isInstallment);

  const getPaymentMethodTranslation = (method: 'cash' | 'card' | 'online'): string => {
    switch (method) {
      case 'cash': return t('paymentMethodCash');
      case 'card': return t('paymentMethodCard');
      case 'online': return t('paymentMethodOnline');
      default: return method;
    }
  }

  const companyName = company?.name || t('shopName');
  const companyAddress = company?.address || t('shopAddress');
  const companyPhone = company?.phone || '';

  return (
    <div id="thermal-receipt-container" className="thermal-receipt-container">
      <header className="text-center space-y-1">
        <h1 className="text-lg font-bold">{companyName}</h1>
        <p>{companyAddress}</p>
        {companyPhone && <p>{t('shopTel')}: {companyPhone}</p>}
        <p>{t('dateLabel')}: {new Date(transactionHeader.transactionDate).toLocaleString()}</p>
        <p>{t('receiptNoLabel')}: {transactionHeader.transactionId}</p>
        {isRefund && transactionHeader.originalTransactionId && (
          <p className='font-bold'>({t('refundForLabel')}: {transactionHeader.originalTransactionId})</p>
        )}
      </header>

      <Line />

      <section className="my-1">
        <p><span className="font-bold">{t('customerLabel')}:</span> {customerDetails.name === 'Walk-in Customer' ? t('walkInCustomer') : customerDetails.name}</p>
        {customerDetails.phone && <p><span className="font-bold">{t('phoneLabel')}:</span> {customerDetails.phone}</p>}
      </section>

      <Line />

      <table className="w-full">
        <thead>
          <tr className="font-bold">
            <th className="text-left">{t('itemHeader')}</th>
            <th className="text-center">{t('qtyHeader')}</th>
            <th className="text-right">{t('priceHeader')}</th>
            <th className="text-right">{t('totalHeader')}</th>
            <th className="text-right">{t('ourPriceHeader')}</th>
          </tr>
        </thead>
        <tbody>
          {transactionLines.map((item, index) => (
            <React.Fragment key={index}>
              <tr>
                <td className="text-left">{item.productName}{item.batchNumber ? ` (${item.batchNumber})` : ''}</td>
                <td className="text-center">{item.displayQuantity} {item.displayUnit}</td>

                <td className="text-right">{item.unitPrice.toFixed(2)}</td>
                <td className="text-right">{item.lineTotalBeforeDiscount.toFixed(2)}</td>

                <td className="text-right">{item.lineTotalAfterDiscount.toFixed(2)}</td>
              </tr>

              {!showAsGiftReceipt && item.lineDiscount > 0 && (
                <tr>
                  <td colSpan={3} className="text-right italic text-gray-600">
                    ({t('discountLabel')})
                  </td>
                  <td className="text-right italic text-gray-600">
                    - {item.lineDiscount.toFixed(2)}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <Line />

      <section className="my-1 space-y-1">
        {!showAsGiftReceipt && (
          <>
            <div className="flex justify-between">
              <span>{t('subtotalLabel')}:</span>
              <span>{transactionHeader.subtotal.toFixed(2)}</span>
            </div>

            {transactionHeader.totalDiscountAmount > 0 && (
              <div className="flex justify-between font-bold text-green-700">
                <span>{t('totalDiscountsLabel')}:</span>
                <span>({transactionHeader.totalDiscountAmount.toFixed(2)})</span>
              </div>
            )}
          </>
        )}

        {!showAsGiftReceipt && (
          <div className="flex justify-between font-bold text-base">
            <span>{t('totalFinalLabel')}:</span>
            <span>Rs.{finalTotalToShow.toFixed(2)}</span>
          </div>
        )}

        {showAsGiftReceipt && (
          <div className="flex justify-between font-bold text-base">
            <span>{t('totalFinalLabel')}:</span>
            <span>Rs.{transactionHeader.subtotal.toFixed(2)}</span>
          </div>
        )}

        {transactionHeader.totalDiscountAmount > 0 && showAsGiftReceipt && (
          <>
            <Line />
            <div className="flex justify-between font-bold text-blue-700">
              <span>{t('savingsLabel')}:</span>
              <span>Rs. {transactionHeader.totalDiscountAmount.toFixed(2)}</span>
            </div>
          </>
        )}
      </section>

      {appliedDiscountsLog.length > 0 && !showAsGiftReceipt && (
        <>
          <Line />
          <section className="my-1">
            <h2 className="font-bold text-center">{t('appliedDiscountsHeader')}</h2>
            {appliedDiscountsLog.map((discount, index) => (
              <div key={index} className="text-left">
                - {discount.sourceRuleName} ({discount.totalCalculatedDiscount.toFixed(2)})
              </div>
            ))}
          </section>
        </>
      )}

      {shouldShowPaymentDetails && (
        <>
          <Line />
          <section className="my-1 space-y-1">
            {isRefund ? (
              <>
                <div className="flex justify-between font-bold">
                  <span>{t('originalBillPaidLabel')}:</span>
                  <span>{originalPaidAmountForRefundContext?.toFixed(2) ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>{t('newBillTotalLabel')}:</span>
                  <span>{finalTotalToShow.toFixed(2)}</span>
                </div>
                <Line />
                {(paymentDetails.paidAmount > 0) ? (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>{t('amountCollectedLabel')}:</span>
                    <span>{paymentDetails.paidAmount.toFixed(2)}</span>
                  </div>
                ) : (paymentDetails.paidAmount < 0) ? (
                  <div className="flex justify-between font-bold text-green-700">
                    <span>{t('amountReturnedLabel')}:</span>
                    <span>{(-paymentDetails.paidAmount).toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between font-bold">
                    <span>{t('netChangeLabel')}:</span>
                    <span>0.00</span>
                  </div>
                )}

                {paymentDetails.outstandingAmount > 0 && (
                  <div className="flex justify-between font-bold">
                    <span>{t('newOutstandingLabel')}:</span>
                    <span>{paymentDetails.outstandingAmount.toFixed(2)}</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>{t('paidLabel')} ({getPaymentMethodTranslation(paymentDetails.paymentMethod)}):</span>
                  <span>{paymentDetails.paidAmount.toFixed(2)}</span>
                </div>

                {paymentDetails.outstandingAmount > 0 ? (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>{t('outstandingLabel')}:</span>
                    <span>{paymentDetails.outstandingAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span>{t('changeLabel')}:</span>
                    <span>{finalCashChange.toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}

      <Line />

      <footer className="text-center mt-2">
        <p>{t('thankYouMessage')}</p>
        <p>{t('comeAgainMessage')}</p>
      </footer>
    </div>
  );
}
