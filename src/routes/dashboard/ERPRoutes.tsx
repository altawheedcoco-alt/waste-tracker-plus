import { Route } from 'react-router-dom';
import { lazyRetry } from './lazyRetry';

const ERPAccounting = lazyRetry(() => import('@/pages/dashboard/erp/ERPAccounting'));
const ERPInventory = lazyRetry(() => import('@/pages/dashboard/erp/ERPInventory'));
const ERPHR = lazyRetry(() => import('@/pages/dashboard/erp/ERPHR'));
const ERPPurchasingAndSales = lazyRetry(() => import('@/pages/dashboard/erp/ERPPurchasingAndSales'));
const ERPFinancialDashboard = lazyRetry(() => import('@/pages/dashboard/erp/ERPFinancialDashboard'));
const ERPRevenueExpensesAnalysis = lazyRetry(() => import('@/pages/dashboard/erp/ERPRevenueExpensesAnalysis'));
const ERPCogs = lazyRetry(() => import('@/pages/dashboard/erp/ERPCogs'));
const ERPFinancialComparisons = lazyRetry(() => import('@/pages/dashboard/erp/ERPFinancialComparisons'));

export const erpRoutes = (
  <>
    <Route path="/dashboard/erp/accounting" element={<ERPAccounting />} />
    <Route path="/dashboard/erp/inventory" element={<ERPInventory />} />
    <Route path="/dashboard/erp/hr" element={<ERPHR />} />
    <Route path="/dashboard/erp/purchasing-sales" element={<ERPPurchasingAndSales />} />
    <Route path="/dashboard/erp/financial-dashboard" element={<ERPFinancialDashboard />} />
    <Route path="/dashboard/erp/revenue-expenses" element={<ERPRevenueExpensesAnalysis />} />
    <Route path="/dashboard/erp/cogs" element={<ERPCogs />} />
    <Route path="/dashboard/erp/financial-comparisons" element={<ERPFinancialComparisons />} />
  </>
);
