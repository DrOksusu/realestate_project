export interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropertyType =
  | 'APARTMENT' | 'OFFICETEL' | 'VILLA' | 'STUDIO'
  | 'COMMERCIAL' | 'OFFICE' | 'BUILDING' | 'LAND' | 'OTHER';

export type PropertyStatus = 'OCCUPIED' | 'VACANT' | 'MAINTENANCE' | 'FOR_SALE';

export type LeaseType = 'JEONSE' | 'MONTHLY' | 'HALF_JEONSE';

export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';

export type PaymentStatus = 'PAID' | 'PENDING' | 'PARTIAL' | 'OVERDUE';

export type PaymentMethod = 'TRANSFER' | 'CASH' | 'CARD' | 'AUTO_TRANSFER';

export type ExpenseType =
  | 'PROPERTY_TAX' | 'INCOME_TAX' | 'MAINTENANCE' | 'INSURANCE'
  | 'MANAGEMENT_FEE' | 'LOAN_INTEREST' | 'VACANCY_COST' | 'AGENT_FEE' | 'OTHER';

export interface Property {
  id: number;
  ownerId: number;
  name: string;
  propertyType: PropertyType;
  address: string;
  addressDetail?: string;
  area: number;
  purchasePrice: number;
  purchaseDate: string;
  acquisitionCost: number;
  loanAmount: number;
  loanInterestRate: number;
  status: PropertyStatus;
  currentValue?: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  leases?: Lease[];
  expenses?: Expense[];
  _count?: {
    expenses: number;
    valuations: number;
  };
}

export interface Tenant {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  idNumber?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  leases?: Lease[];
}

export interface Lease {
  id: number;
  propertyId: number;
  tenantId: number;
  floor?: string;
  areaPyeong?: number;
  leaseType: LeaseType;
  deposit: number;
  monthlyRent: number;
  managementFee: number;
  hasVat: boolean;
  startDate: string;
  endDate: string;
  rentDueDay: number;
  status: LeaseStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
  tenant?: Tenant;
  rentPayments?: RentPayment[];
}

export interface RentPayment {
  id: number;
  leaseId: number;
  paymentYear: number;
  paymentMonth: number;
  dueDate: string;
  paymentDate?: string;
  rentAmount: number;
  managementFeeAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  rentStatus: PaymentStatus;
  managementFeeStatus: PaymentStatus;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  lease?: Lease;
}

export interface Expense {
  id: number;
  propertyId: number;
  expenseType: ExpenseType;
  amount: number;
  expenseDate: string;
  description?: string;
  isRecurring: boolean;
  recurringMonth?: number;
  memo?: string;
  createdAt: string;
  updatedAt: string;
  property?: Property;
}

export interface PropertyValuation {
  id: number;
  propertyId: number;
  annualRent: number;
  totalDeposit: number;
  annualExpense: number;
  netIncome: number;
  totalInvestment: number;
  grossYield: number;
  netYield: number;
  cashOnCash: number;
  targetYield: number;
  suggestedPrice: number;
  expectedProfit: number;
  memo?: string;
  calculatedAt: string;
  property?: Property;
}

export interface PortfolioSummary {
  totalProperties: number;
  occupiedCount: number;
  vacantCount: number;
  financials: {
    totalPurchasePrice: number;
    totalCurrentValue: number;
    totalLoanAmount: number;
    totalEquity: number;
    totalMonthlyRent: number;
    totalAnnualRent: number;
    totalAnnualExpense: number;
    totalNetIncome: number;
  };
  yields: {
    avgGrossYield: number;
    avgNetYield: number;
    avgCashOnCash: number;
  };
  properties: {
    id: number;
    name: string;
    status: PropertyStatus;
    purchasePrice: number;
    currentValue: number;
    monthlyRent: number;
    leaseCount: number;
  }[];
}
