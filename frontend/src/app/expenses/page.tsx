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
import { expenseApi, propertyApi } from '@/lib/api';
import { Expense, Property } from '@/types';
import { formatCurrency, formatDate, expenseTypeLabels, formatCurrencyMan } from '@/lib/utils';

interface ExpenseForm {
  propertyId: number;
  expenseType: string;
  amount: number;
  expenseDate: string;
  description: string;
  memo: string;
}

function ExpensesContent() {
  const searchParams = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [filterPropertyId, setFilterPropertyId] = useState<string>(searchParams.get('propertyId') || '');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseForm>({
    defaultValues: {
      expenseType: 'MAINTENANCE',
      expenseDate: new Date().toISOString().split('T')[0],
    },
  });

  useEffect(() => {
    loadData();
  }, [filterPropertyId, filterYear]);

  const loadData = async () => {
    try {
      const params: any = { year: filterYear };
      if (filterPropertyId) params.propertyId = Number(filterPropertyId);

      const [expensesRes, propertiesRes, summaryRes] = await Promise.all([
        expenseApi.getAll(params),
        propertyApi.getAll(),
        expenseApi.getSummary(params),
      ]);

      setExpenses(expensesRes.data);
      setProperties(propertiesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ExpenseForm) => {
    setIsSubmitting(true);
    try {
      await expenseApi.create({
        ...data,
        propertyId: Number(data.propertyId),
        amount: Number(data.amount),
      });
      setShowModal(false);
      reset();
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('지출 내역을 삭제하시겠습니까?')) return;
    try {
      await expenseApi.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  const propertyOptions = [
    { value: '', label: '전체 부동산' },
    ...properties.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const expenseTypeOptions = Object.entries(expenseTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">지출 관리</h1>
          <Button onClick={() => setShowModal(true)}>+ 등록</Button>
        </div>

        {/* 필터 */}
        <div className="flex gap-2">
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <select
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm flex-1"
          >
            {propertyOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* 요약 */}
        {summary && (
          <Card title={`${summary.year}년 지출 요약`}>
            <div className="space-y-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-sm text-gray-500">총 지출</div>
                <div className="text-2xl font-bold text-red-600">{formatCurrencyMan(summary.total)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {summary.byType.slice(0, 6).map((item: any) => (
                  <div key={item.type} className="p-2 bg-gray-50 rounded-lg text-sm">
                    <div className="text-gray-500">{expenseTypeLabels[item.type]}</div>
                    <div className="font-medium">{formatCurrency(item.amount)}</div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : expenses.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>지출 내역이 없습니다.</p>
              <button onClick={() => setShowModal(true)} className="text-blue-600 hover:underline mt-2">
                지출 등록하기
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <Card key={expense.id}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{expenseTypeLabels[expense.expenseType]}</span>
                      <span className="text-sm text-gray-500">{expense.property?.name}</span>
                    </div>
                    {expense.description && (
                      <p className="text-sm text-gray-600 mt-1">{expense.description}</p>
                    )}
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDate(expense.expenseDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">{formatCurrency(expense.amount)}</div>
                    <button
                      onClick={() => handleDelete(expense.id)}
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

      {/* 등록 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="지출 등록">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Select
            label="부동산"
            options={[{ value: '0', label: '선택하세요' }, ...properties.map((p) => ({ value: String(p.id), label: p.name }))]}
            {...register('propertyId', { validate: (v) => v > 0 || '부동산을 선택하세요' })}
            error={errors.propertyId?.message}
          />

          <Select
            label="지출 유형"
            options={expenseTypeOptions}
            {...register('expenseType')}
          />

          <Input
            label="금액 (원)"
            type="number"
            {...register('amount', { required: '금액을 입력하세요' })}
            error={errors.amount?.message}
          />

          <Input
            label="지출일"
            type="date"
            {...register('expenseDate', { required: '지출일을 선택하세요' })}
            error={errors.expenseDate?.message}
          />

          <Input
            label="설명"
            {...register('description')}
          />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              등록
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    }>
      <ExpensesContent />
    </Suspense>
  );
}
