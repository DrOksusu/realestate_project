'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { valuationApi, propertyApi } from '@/lib/api';
import { PropertyValuation, Property } from '@/types';
import { formatCurrencyMan, formatCurrency, formatDate } from '@/lib/utils';

interface ValuationForm {
  propertyId: number;
  targetYield: number;
  memo: string;
}

function ValuationsContent() {
  const searchParams = useSearchParams();
  const [valuations, setValuations] = useState<PropertyValuation[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedValuation, setSelectedValuation] = useState<PropertyValuation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const defaultPropertyId = searchParams.get('propertyId');

  const { register, handleSubmit, formState: { errors } } = useForm<ValuationForm>({
    defaultValues: {
      propertyId: defaultPropertyId ? Number(defaultPropertyId) : 0,
      targetYield: 5,
    },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [valuationsRes, propertiesRes] = await Promise.all([
        valuationApi.getAll(),
        propertyApi.getAll(),
      ]);
      setValuations(valuationsRes.data);
      setProperties(propertiesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ValuationForm) => {
    setIsSubmitting(true);
    try {
      const response = await valuationApi.calculate({
        propertyId: Number(data.propertyId),
        targetYield: Number(data.targetYield),
        memo: data.memo,
      });
      setResult(response.data);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '계산에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('시뮬레이션을 삭제하시겠습니까?')) return;
    try {
      await valuationApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const handleViewDetail = (valuation: PropertyValuation) => {
    setSelectedValuation(valuation);
    setShowDetailModal(true);
  };

  // 보증금 계산 (totalDeposit이 없으면 leases에서 계산)
  const getDeposit = (valuation: PropertyValuation): number => {
    if (valuation.totalDeposit && Number(valuation.totalDeposit) > 0) {
      return Number(valuation.totalDeposit);
    }
    // leases에서 계산
    const leases = (valuation.property as any)?.leases || [];
    return leases.reduce((sum: number, lease: any) => sum + Number(lease.deposit || 0), 0);
  };

  const propertyOptions = [
    { value: '0', label: '부동산 선택' },
    ...properties.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">수익률 분석</h1>
          <Button onClick={() => { setResult(null); setShowModal(true); }}>+ 새 분석</Button>
        </div>

        {/* 결과 카드 */}
        {result && (
          <Card title="분석 결과" className="border-blue-200 bg-blue-50">
            <div className="space-y-4">
              <div className="text-lg font-semibold">{result.valuation.property?.name}</div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">총수익률</div>
                  <div className="text-xl font-bold text-blue-600">{result.details.yields.grossYield}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">순수익률</div>
                  <div className="text-xl font-bold text-green-600">{result.details.yields.netYield}%</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-sm text-gray-500">현금수익률</div>
                  <div className="text-xl font-bold text-purple-600">{result.details.yields.cashOnCash}%</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-white rounded-lg">
                <div>
                  <div className="text-sm text-gray-500">연간 임대수입</div>
                  <div className="font-medium">{formatCurrencyMan(result.details.annualRent)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">연간 지출</div>
                  <div className="font-medium">{formatCurrencyMan(result.details.totalAnnualExpense)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">연간 순수익</div>
                  <div className="font-medium text-green-600">{formatCurrencyMan(result.details.netIncome)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">총 보증금</div>
                  <div className="font-medium text-blue-600">{formatCurrencyMan(result.details.totalDeposit)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">투자 자기자본</div>
                  <div className="font-medium">{formatCurrencyMan(result.details.totalInvestment)}</div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-gray-500">목표 수익률 {result.details.targetYield}% 기준</div>
                <div className="text-2xl font-bold text-yellow-700">
                  제안 매도가: {formatCurrencyMan(result.details.suggestedPrice)}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  예상 매매차익: {formatCurrencyMan(result.details.expectedProfit)}
                </div>
              </div>

              <Button variant="secondary" className="w-full" onClick={() => setResult(null)}>
                닫기
              </Button>
            </div>
          </Card>
        )}

        {/* 저장된 시뮬레이션 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : valuations.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>저장된 분석 결과가 없습니다.</p>
              <button onClick={() => setShowModal(true)} className="text-blue-600 hover:underline mt-2">
                새 분석 시작하기
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700">저장된 분석</h2>
            {valuations.map((valuation) => (
              <Card
                key={valuation.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleViewDetail(valuation)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{valuation.property?.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(valuation.calculatedAt)} 분석
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span>순수익률 <strong>{valuation.netYield}%</strong></span>
                      <span>현금수익률 <strong>{valuation.cashOnCash}%</strong></span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">목표 {valuation.targetYield}%</div>
                    <div className="font-semibold text-lg">{formatCurrencyMan(valuation.suggestedPrice)}</div>
                    <button
                      onClick={(e) => handleDelete(valuation.id, e)}
                      className="text-sm text-gray-500 hover:text-red-600 mt-1"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 새 분석 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="수익률 분석">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="부동산"
            options={propertyOptions}
            {...register('propertyId', { validate: (v) => v > 0 || '부동산을 선택하세요' })}
            error={errors.propertyId?.message}
          />

          <Input
            label="목표 수익률 (%)"
            type="number"
            step="0.1"
            {...register('targetYield', { required: '목표 수익률을 입력하세요' })}
            error={errors.targetYield?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              {...register('memo')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              분석
            </Button>
          </div>
        </form>
      </Modal>

      {/* 상세 보기 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="매도가 산출 내역"
      >
        {selectedValuation && (
          <div className="space-y-4">
            <div className="text-lg font-semibold text-center border-b pb-3">
              {selectedValuation.property?.name}
            </div>

            {/* 매도가 산출 공식 */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">매도가 산출 공식</div>
              <div className="text-center font-mono text-sm bg-white p-3 rounded border">
                제안 매도가 = (연간 임대료 ÷ 목표수익률) + 보증금
              </div>
            </div>

            {/* 산출 내역 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">연간 임대료</span>
                <span className="font-semibold">{formatCurrencyMan(selectedValuation.annualRent)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">목표 수익률</span>
                <span className="font-semibold">{selectedValuation.targetYield}%</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b bg-gray-50 px-2 rounded">
                <span className="text-gray-600">연간 임대료 ÷ 목표수익률</span>
                <span className="font-semibold">
                  {formatCurrencyMan(Number(selectedValuation.annualRent) / (Number(selectedValuation.targetYield) / 100))}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">총 보증금 (+)</span>
                <span className="font-semibold text-blue-600">
                  {formatCurrencyMan(getDeposit(selectedValuation))}
                </span>
              </div>
            </div>

            {/* 최종 매도가 */}
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">제안 매도가</span>
                <span className="font-bold text-2xl text-yellow-700">
                  {formatCurrencyMan(selectedValuation.suggestedPrice)}
                </span>
              </div>
            </div>

            {/* 추가 정보 */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">연간 지출</div>
                <div className="font-medium">{formatCurrencyMan(selectedValuation.annualExpense)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">연간 순수익</div>
                <div className="font-medium text-green-600">{formatCurrencyMan(selectedValuation.netIncome)}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">예상 매매차익</div>
                <div className={`font-medium ${Number(selectedValuation.expectedProfit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrencyMan(selectedValuation.expectedProfit)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500">분석일</div>
                <div className="font-medium">{formatDate(selectedValuation.calculatedAt)}</div>
              </div>
            </div>

            {selectedValuation.memo && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-gray-500 text-sm">메모</div>
                <div className="mt-1">{selectedValuation.memo}</div>
              </div>
            )}

            <Button
              variant="secondary"
              className="w-full"
              onClick={() => setShowDetailModal(false)}
            >
              닫기
            </Button>
          </div>
        )}
      </Modal>
    </Layout>
  );
}

export default function ValuationsPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    }>
      <ValuationsContent />
    </Suspense>
  );
}
