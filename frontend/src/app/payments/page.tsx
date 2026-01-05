'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { rentPaymentApi } from '@/lib/api';
import { RentPayment } from '@/types';
import { formatCurrency, formatDate, paymentStatusLabels, paymentStatusColors } from '@/lib/utils';

function PaymentsContent() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<RentPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>(searchParams.get('status') || '');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(0);

  useEffect(() => {
    loadPayments();
  }, [filter, year, month]);

  const loadPayments = async () => {
    try {
      const params: any = {};
      if (filter) params.status = filter;
      if (year) params.year = year;
      if (month) params.month = month;

      const response = await rentPaymentApi.getAll(params);
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkPaid = async (paymentId: number) => {
    try {
      await rentPaymentApi.updateStatus(paymentId, {
        rentStatus: 'PAID',
        managementFeeStatus: 'PAID',
        paymentDate: new Date().toISOString(),
      });
      loadPayments();
    } catch (error: any) {
      alert(error.response?.data?.error || '처리에 실패했습니다.');
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">납부 관리</h1>

        {/* 필터 */}
        <div className="flex flex-wrap gap-2">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={0}>전체 월</option>
            {months.map((m) => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>

          <div className="flex gap-1">
            {[
              { value: '', label: '전체' },
              { value: 'PENDING', label: '미납' },
              { value: 'PAID', label: '완료' },
              { value: 'OVERDUE', label: '연체' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.rentStatus === 'PAID').length}
            </div>
            <div className="text-sm text-gray-500">납부 완료</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {payments.filter((p) => p.rentStatus === 'PENDING').length}
            </div>
            <div className="text-sm text-gray-500">미납</div>
          </Card>
          <Card className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {payments.filter((p) => p.rentStatus === 'OVERDUE').length}
            </div>
            <div className="text-sm text-gray-500">연체</div>
          </Card>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : payments.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              납부 내역이 없습니다.
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{payment.lease?.property?.name}</span>
                      <Badge className={paymentStatusColors[payment.rentStatus]}>
                        {paymentStatusLabels[payment.rentStatus]}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {payment.lease?.tenant?.name} · {payment.paymentYear}년 {payment.paymentMonth}월
                    </div>
                    <div className="text-sm text-gray-500">
                      납부예정: {formatDate(payment.dueDate)}
                      {payment.paymentDate && ` → 납부: ${formatDate(payment.paymentDate)}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(payment.totalAmount)}</div>
                    <div className="text-xs text-gray-500">
                      월세 {formatCurrency(payment.rentAmount)} + 관리비 {formatCurrency(payment.managementFeeAmount)}
                    </div>
                    {payment.rentStatus !== 'PAID' && (
                      <button
                        onClick={() => handleMarkPaid(payment.id)}
                        className="mt-2 text-sm text-blue-600 hover:underline"
                      >
                        납부 완료
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    }>
      <PaymentsContent />
    </Suspense>
  );
}
