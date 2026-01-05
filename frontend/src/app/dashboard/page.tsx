'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { valuationApi, rentPaymentApi } from '@/lib/api';
import { PortfolioSummary, RentPayment } from '@/types';
import { formatCurrencyMan, formatCurrency, propertyStatusLabels, propertyStatusColors } from '@/lib/utils';

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [overduePayments, setOverduePayments] = useState<RentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, overdueRes] = await Promise.all([
        valuationApi.getPortfolioSummary(),
        rentPaymentApi.getOverdue(),
      ]);
      setSummary(summaryRes.data);
      setOverduePayments(overdueRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">대시보드</h1>

        {/* 요약 카드들 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <div className="text-blue-100 text-sm">총 부동산</div>
            <div className="text-2xl font-bold mt-1">{summary?.totalProperties || 0}개</div>
            <div className="text-blue-100 text-xs mt-2">
              임대중 {summary?.occupiedCount || 0} / 공실 {summary?.vacantCount || 0}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <div className="text-green-100 text-sm">월 임대수입</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrencyMan(summary?.financials.totalMonthlyRent || 0)}
            </div>
            <div className="text-green-100 text-xs mt-2">
              연 {formatCurrencyMan(summary?.financials.totalAnnualRent || 0)}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <div className="text-purple-100 text-sm">순수익률</div>
            <div className="text-2xl font-bold mt-1">{summary?.yields.avgNetYield || 0}%</div>
            <div className="text-purple-100 text-xs mt-2">
              현금수익률 {summary?.yields.avgCashOnCash || 0}%
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <div className="text-orange-100 text-sm">총 자산가치</div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrencyMan(summary?.financials.totalCurrentValue || 0)}
            </div>
            <div className="text-orange-100 text-xs mt-2">
              순자산 {formatCurrencyMan(summary?.financials.totalEquity || 0)}
            </div>
          </Card>
        </div>

        {/* 미납 내역 */}
        {overduePayments.length > 0 && (
          <Card title="미납 내역" className="border-red-200 bg-red-50">
            <div className="space-y-3">
              {overduePayments.slice(0, 5).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                  <div>
                    <div className="font-medium">{payment.lease?.property?.name}</div>
                    <div className="text-sm text-gray-500">
                      {payment.lease?.tenant?.name} · {payment.paymentYear}년 {payment.paymentMonth}월
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{formatCurrency(payment.totalAmount)}</div>
                    <Badge variant="danger">연체</Badge>
                  </div>
                </div>
              ))}
              {overduePayments.length > 5 && (
                <Link href="/payments?status=OVERDUE" className="block text-center text-blue-600 text-sm">
                  +{overduePayments.length - 5}건 더보기
                </Link>
              )}
            </div>
          </Card>
        )}

        {/* 부동산 목록 */}
        <Card
          title="내 부동산"
          action={
            <Link href="/properties" className="text-blue-600 text-sm hover:underline">
              전체보기
            </Link>
          }
        >
          {summary?.properties.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>등록된 부동산이 없습니다.</p>
              <Link href="/properties/new" className="text-blue-600 hover:underline mt-2 inline-block">
                부동산 등록하기
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {summary?.properties.map((property) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <div className="font-medium">{property.name}</div>
                    <div className="text-sm text-gray-500">
                      계약 {property.leaseCount}건 · 월세 {formatCurrencyMan(property.monthlyRent)}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={propertyStatusColors[property.status]}>
                      {propertyStatusLabels[property.status]}
                    </Badge>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatCurrencyMan(property.currentValue)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* 재무 요약 */}
        <Card title="재무 요약">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">총 매입가</div>
              <div className="font-semibold">{formatCurrencyMan(summary?.financials.totalPurchasePrice || 0)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">대출금</div>
              <div className="font-semibold">{formatCurrencyMan(summary?.financials.totalLoanAmount || 0)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">연간 지출</div>
              <div className="font-semibold">{formatCurrencyMan(summary?.financials.totalAnnualExpense || 0)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">연간 순수익</div>
              <div className="font-semibold text-green-600">
                {formatCurrencyMan(summary?.financials.totalNetIncome || 0)}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
