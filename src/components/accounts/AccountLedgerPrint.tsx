import { forwardRef } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { LedgerEntry } from './AccountLedger';

interface AccountLedgerPrintProps {
  partnerName: string;
  partnerType: string;
  entries: LedgerEntry[];
  previousBalance?: number;
  organizationName?: string;
  printDate?: string;
}

const AccountLedgerPrint = forwardRef<HTMLDivElement, AccountLedgerPrintProps>(
  ({ partnerName, partnerType, entries, previousBalance = 0, organizationName, printDate }, ref) => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
      }).format(amount);
    };

    const formatDate = (dateStr: string) => {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ar });
    };

    const getTypeLabel = (type: string) => {
      switch (type) {
        case 'generator': return 'مولد';
        case 'recycler': return 'مدور';
        case 'transporter': return 'ناقل';
        case 'guest': return 'عميل خارجي';
        default: return type;
      }
    };

    const getEntryTypeLabel = (type: string, isCancelled?: boolean) => {
      if (isCancelled) return 'ملغاة';
      switch (type) {
        case 'shipment': return 'شحنة';
        case 'invoice': return 'فاتورة';
        case 'payment': return 'دفعة';
        case 'deposit': return 'إيداع';
        default: return type;
      }
    };

    // Calculate running balance and totals
    let runningBalance = previousBalance;
    const entriesWithBalance = entries.map(entry => {
      runningBalance = runningBalance + entry.debit - entry.credit;
      return { ...entry, balance: runningBalance };
    });

    const totalDebit = entries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = entries.reduce((sum, e) => sum + e.credit, 0);
    const finalBalance = previousBalance + totalDebit - totalCredit;

    const currentDate = printDate || format(new Date(), 'dd/MM/yyyy - hh:mm a', { locale: ar });

    return (
      <div 
        ref={ref} 
        className="bg-white text-black"
        style={{ 
          width: '210mm', 
          minHeight: '297mm', 
          padding: '15mm 15mm 20mm 15mm',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10pt',
          direction: 'rtl',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '15px' }}>
          <h1 style={{ fontSize: '18pt', fontWeight: 'bold', marginBottom: '5px' }}>
            كشف حساب الشريك
          </h1>
          {organizationName && (
            <p style={{ fontSize: '12pt', color: '#666', marginBottom: '10px' }}>{organizationName}</p>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9pt', color: '#666' }}>
            <span>تاريخ الطباعة: {currentDate}</span>
            <span>عدد الحركات: {entries.length}</span>
          </div>
        </div>

        {/* Partner Info */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px'
        }}>
          <div>
            <strong>اسم الشريك:</strong> {partnerName}
          </div>
          <div>
            <strong>النوع:</strong> {getTypeLabel(partnerType)}
          </div>
          {previousBalance !== 0 && (
            <div>
              <strong>الرصيد السابق:</strong>{' '}
              <span style={{ color: previousBalance > 0 ? '#dc2626' : '#16a34a' }}>
                {formatCurrency(Math.abs(previousBalance))} ج.م 
                ({previousBalance > 0 ? 'مدين' : 'دائن'})
              </span>
            </div>
          )}
        </div>

        {/* Ledger Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr style={{ backgroundColor: '#e5e7eb' }}>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '30px' }}>#</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '70px' }}>التاريخ</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '50px' }}>النوع</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>البيان</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '60px' }}>الكمية</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '60px' }}>السعر</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '70px' }}>مدين</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '70px' }}>دائن</th>
              <th style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'center', width: '80px' }}>الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {entriesWithBalance.map((entry, index) => (
              <tr 
                key={entry.id}
                style={{ 
                  backgroundColor: index % 2 === 0 ? '#fff' : '#fafafa',
                  textDecoration: entry.isCancelled ? 'line-through' : 'none',
                  color: entry.isCancelled ? '#999' : 'inherit'
                }}
              >
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>{index + 1}</td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                  {formatDate(entry.date)}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', fontSize: '9pt' }}>
                  {getEntryTypeLabel(entry.type, entry.isCancelled)}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <div>{entry.description}</div>
                  {entry.reference && (
                    <div style={{ fontSize: '8pt', color: '#666' }}>{entry.reference}</div>
                  )}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>
                  {entry.quantity ? `${formatCurrency(entry.quantity)} ${entry.unit || ''}` : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center' }}>
                  {entry.unitPrice ? formatCurrency(entry.unitPrice) : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', color: '#dc2626' }}>
                  {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                </td>
                <td style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'center', color: '#16a34a' }}>
                  {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                </td>
                <td style={{ 
                  border: '1px solid #ccc', 
                  padding: '5px', 
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: entry.balance > 0 ? '#dc2626' : entry.balance < 0 ? '#16a34a' : 'inherit'
                }}>
                  {formatCurrency(Math.abs(entry.balance))}
                </td>
              </tr>
            ))}
          </tbody>
          {/* Totals Row */}
          <tfoot>
            <tr style={{ backgroundColor: '#e5e7eb', fontWeight: 'bold' }}>
              <td colSpan={6} style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>
                الإجمالي
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: '#dc2626' }}>
                {formatCurrency(totalDebit)}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'center', color: '#16a34a' }}>
                {formatCurrency(totalCredit)}
              </td>
              <td style={{ 
                border: '1px solid #ccc', 
                padding: '8px', 
                textAlign: 'center',
                color: finalBalance > 0 ? '#dc2626' : finalBalance < 0 ? '#16a34a' : 'inherit'
              }}>
                {formatCurrency(Math.abs(finalBalance))}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Summary Footer */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          padding: '15px', 
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>إجمالي المدين (علينا)</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#dc2626' }}>
              {formatCurrency(totalDebit)} ج.م
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>إجمالي الدائن (لنا)</div>
            <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#16a34a' }}>
              {formatCurrency(totalCredit)} ج.م
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '9pt', color: '#666' }}>الرصيد النهائي</div>
            <div style={{ 
              fontSize: '14pt', 
              fontWeight: 'bold', 
              color: finalBalance > 0 ? '#dc2626' : finalBalance < 0 ? '#16a34a' : 'inherit'
            }}>
              {formatCurrency(Math.abs(finalBalance))} ج.م
              <span style={{ fontSize: '10pt', marginRight: '5px' }}>
                ({finalBalance > 0 ? 'علينا' : finalBalance < 0 ? 'لنا' : 'مسدد'})
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          fontSize: '8pt', 
          color: '#999', 
          borderTop: '1px solid #ddd', 
          paddingTop: '10px' 
        }}>
          <p>هذا الكشف صادر من منصة iRecycle لإدارة المخلفات</p>
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
        </div>
      </div>
    );
  }
);

AccountLedgerPrint.displayName = 'AccountLedgerPrint';

export default AccountLedgerPrint;
