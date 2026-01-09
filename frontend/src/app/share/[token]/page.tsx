'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { shareApi } from '@/lib/api';
import {
  formatCurrencyMan,
  formatCurrency,
  formatDate,
  propertyTypeLabels,
  propertyStatusLabels,
  leaseTypeLabels,
} from '@/lib/utils';
import Tooltip from '@/components/ui/Tooltip';

interface SharedProperty {
  id: number;
  name: string;
  propertyType: string;
  address: string;
  area: string;
  status: string;
  purchasePrice: string;
  acquisitionCost: string;
  loanAmount: string;
  currentValue: string | null;
  leases: Array<{
    id: number;
    leaseType: string;
    deposit: string;
    monthlyRent: string;
    managementFee: string;
    hasVat: boolean;
    startDate: string;
    endDate: string;
    status: string;
    tenant: { name: string };
  }>;
  valuations: Array<{
    id: number;
    annualRent: string;
    totalDeposit: string;
    annualExpense: string;
    netIncome: string;
    totalInvestment: string;
    grossYield: string;
    netYield: string;
    cashOnCash: string;
    targetYield: string;
    suggestedPrice: string;
    expectedProfit: string;
    calculatedAt: string;
  }>;
}

export default function SharedPropertyPage() {
  const params = useParams();
  const [property, setProperty] = useState<SharedProperty | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = params.token as string;

  useEffect(() => {
    loadSharedProperty();
  }, [token]);

  const loadSharedProperty = async () => {
    try {
      const response = await shareApi.getSharedProperty(token);
      setProperty(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('공유 링크가 유효하지 않습니다.');
      } else if (err.response?.status === 410) {
        setError('공유 링크가 만료되었습니다.');
      } else {
        setError('페이지를 불러올 수 없습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error || '페이지를 찾을 수 없습니다'}
          </h1>
          <p className="text-gray-500">링크를 다시 확인해 주세요.</p>
        </div>
      </div>
    );
  }

  const activeLeases = property.leases.filter((l) => l.status === 'ACTIVE');
  const totalDeposit = activeLeases.reduce((sum, l) => sum + Number(l.deposit), 0);
  const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + Number(l.monthlyRent), 0);
  const latestValuation = property.valuations[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
              공유된 페이지
            </span>
            <span>읽기 전용</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
          <p className="text-gray-500">{property.address}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold mb-4">기본 정보</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">물건 유형</div>
              <div className="font-medium">
                {propertyTypeLabels[property.propertyType as keyof typeof propertyTypeLabels] || property.propertyType}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">면적</div>
              <div className="font-medium">{property.area}㎡</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">상태</div>
              <div className="font-medium">
                {propertyStatusLabels[property.status as keyof typeof propertyStatusLabels] || property.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">현재 시세</div>
              <div className="font-medium">
                {formatCurrencyMan(property.currentValue || property.purchasePrice)}
              </div>
            </div>
          </div>
        </div>

        {/* 임대 현황 */}
        {activeLeases.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">임대 현황</h2>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-sm text-gray-500">총 보증금</div>
                <div className="font-bold text-xl text-green-600">
                  {formatCurrencyMan(totalDeposit)}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <div className="text-sm text-gray-500">월 임대료</div>
                <div className="font-bold text-xl text-blue-600">
                  {formatCurrency(totalMonthlyRent)}
                </div>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg text-center">
                <div className="text-sm text-gray-500">연간 임대 수입</div>
                <div className="font-bold text-xl text-orange-600">
                  {formatCurrencyMan(totalMonthlyRent * 12)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {activeLeases.map((lease) => {
                const monthlyRent = Number(lease.monthlyRent);
                const managementFee = Number(lease.managementFee);
                const vat = lease.hasVat ? Math.round((monthlyRent + managementFee) * 0.1) : 0;
                const monthlyTotal = monthlyRent + managementFee + vat;

                return (
                  <div key={lease.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-medium">{lease.tenant.name}</div>
                        <div className="text-sm text-gray-500">
                          {leaseTypeLabels[lease.leaseType as keyof typeof leaseTypeLabels]} · {formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}
                        </div>
                      </div>
                    </div>

                    {lease.leaseType === 'JEONSE' ? (
                      <div className="text-right font-medium">
                        보증금 {formatCurrencyMan(lease.deposit)}
                      </div>
                    ) : (
                      <div className="mt-2 pt-2 border-t border-gray-200 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">보증금</span>
                          <span>{formatCurrencyMan(lease.deposit)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">월세</span>
                          <span>{formatCurrency(monthlyRent)}</span>
                        </div>
                        {managementFee > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-500">관리비 별도</span>
                            <span>{formatCurrency(managementFee)}</span>
                          </div>
                        )}
                        {lease.hasVat && (
                          <div className="flex justify-between text-orange-600">
                            <span>부가세 (10%)</span>
                            <span>{formatCurrency(vat)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold pt-1 border-t border-gray-300">
                          <span>월 합계</span>
                          <span className="text-blue-600">{formatCurrency(monthlyTotal)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 수익률 분석 */}
        {latestValuation && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4">수익률 분석</h2>
            <div className="text-sm text-gray-500 mb-4">
              분석일: {formatDate(latestValuation.calculatedAt)}
            </div>

            {/* 수익률 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Tooltip content="연간 임대료 ÷ 매입가 × 100" position="bottom">
                <div className="p-4 bg-blue-50 rounded-lg text-center cursor-help">
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    총 수익률
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-bold text-2xl text-blue-600">
                    {latestValuation.grossYield}%
                  </div>
                </div>
              </Tooltip>
              <Tooltip content="(연간 임대료 - 지출 - 대출이자) ÷ 매입가 × 100" position="bottom">
                <div className="p-4 bg-green-50 rounded-lg text-center cursor-help">
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    순 수익률
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-bold text-2xl text-green-600">
                    {latestValuation.netYield}%
                  </div>
                </div>
              </Tooltip>
              <Tooltip content={<div className="text-left"><div>순수익 ÷ 자기자본 × 100</div><div className="text-xs mt-1 text-gray-300">자기자본 = 매입가 + 취득비용 - 대출 - 보증금</div></div>} position="bottom">
                <div className="p-4 bg-purple-50 rounded-lg text-center cursor-help">
                  <div className="text-sm text-gray-500 flex items-center justify-center gap-1">
                    현금수익률
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="font-bold text-2xl text-purple-600">
                    {latestValuation.cashOnCash}%
                  </div>
                </div>
              </Tooltip>
            </div>

            {/* 매도가 산출 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">매도가 산출 (목표수익률 {latestValuation.targetYield}%)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">연간 임대료</span>
                  <span>{formatCurrencyMan(latestValuation.annualRent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">총 보증금</span>
                  <span>{formatCurrencyMan(latestValuation.totalDeposit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">연간 임대료 ÷ 목표수익률</span>
                  <span>
                    {formatCurrencyMan(
                      Math.round(Number(latestValuation.annualRent) / (Number(latestValuation.targetYield) / 100))
                    )}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                  <span>제안 매도가</span>
                  <span className="text-blue-600">
                    {formatCurrencyMan(latestValuation.suggestedPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* 예상 수익 */}
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">예상 매매차익</span>
                <span className="font-bold text-xl text-green-600">
                  {formatCurrencyMan(latestValuation.expectedProfit)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="text-center text-sm text-gray-400 py-4">
          부동산 관리 시스템에서 공유된 페이지입니다.
        </div>
      </div>
    </div>
  );
}
