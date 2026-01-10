'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { leaseApi } from '@/lib/api';
import { Lease } from '@/types';
import { leaseTypeLabels } from '@/lib/utils';

interface LeaseForm {
  floor: string;
  areaPyeong: number;
  leaseType: string;
  deposit: number;
  monthlyRent: number;
  managementFee: number;
  hasVat: boolean;
  startDate: string;
  endDate: string;
  rentDueDay: number;
  memo: string;
}

export default function EditLeasePage() {
  const router = useRouter();
  const params = useParams();
  const leaseId = Number(params.id);

  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<LeaseForm>();

  const leaseType = watch('leaseType');

  useEffect(() => {
    loadLease();
  }, [leaseId]);

  const loadLease = async () => {
    try {
      const response = await leaseApi.getOne(leaseId);
      const leaseData = response.data;
      setLease(leaseData);

      // Format dates for input[type="date"]
      const formatDateForInput = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0];
      };

      reset({
        floor: leaseData.floor || '',
        areaPyeong: Number(leaseData.areaPyeong) || 0,
        leaseType: leaseData.leaseType,
        deposit: Number(leaseData.deposit),
        monthlyRent: Number(leaseData.monthlyRent),
        managementFee: Number(leaseData.managementFee),
        hasVat: leaseData.hasVat || false,
        startDate: formatDateForInput(leaseData.startDate),
        endDate: formatDateForInput(leaseData.endDate),
        rentDueDay: leaseData.rentDueDay,
        memo: leaseData.memo || '',
      });
    } catch (error) {
      console.error('Failed to load lease:', error);
      setError('계약 정보를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LeaseForm) => {
    setIsSubmitting(true);
    setError('');

    try {
      await leaseApi.update(leaseId, {
        floor: data.floor || null,
        areaPyeong: Number(data.areaPyeong) || null,
        leaseType: data.leaseType,
        deposit: Number(data.deposit),
        monthlyRent: Number(data.monthlyRent) || 0,
        managementFee: Number(data.managementFee) || 0,
        hasVat: data.hasVat || false,
        startDate: data.startDate,
        endDate: data.endDate,
        rentDueDay: Number(data.rentDueDay) || 1,
        memo: data.memo,
      });
      router.push(`/leases/${leaseId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const leaseTypeOptions = Object.entries(leaseTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!lease) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">계약을 찾을 수 없습니다.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">계약 수정</h1>
          <p className="text-gray-500 mt-1">
            {lease.property?.name} - {lease.tenant?.name}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card title="호실 정보">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="층수"
                placeholder="예: 1층, B1, 2-3층"
                {...register('floor')}
              />
              <Input
                label="전용면적 (평)"
                type="number"
                step="0.01"
                placeholder="예: 10.5"
                {...register('areaPyeong')}
              />
            </div>
          </Card>

          <Card title="계약 유형">
            <Select
              label="계약 유형"
              options={leaseTypeOptions}
              {...register('leaseType')}
            />
          </Card>

          <Card title="계약 조건">
            <div className="space-y-4">
              <Input
                label="보증금 (원)"
                type="number"
                placeholder="보증금"
                {...register('deposit', { required: '보증금을 입력하세요' })}
                error={errors.deposit?.message}
              />

              {leaseType !== 'JEONSE' && (
                <>
                  <Input
                    label="월세 (원)"
                    type="number"
                    placeholder="월세"
                    {...register('monthlyRent')}
                  />

                  <Input
                    label="관리비 (원)"
                    type="number"
                    placeholder="관리비"
                    {...register('managementFee')}
                  />

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('hasVat')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">부가세 별도 (상가/사무실)</span>
                  </label>

                  <Input
                    label="납부일 (매월)"
                    type="number"
                    min={1}
                    max={31}
                    placeholder="1"
                    {...register('rentDueDay')}
                  />
                </>
              )}
            </div>
          </Card>

          <Card title="계약 기간">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="시작일"
                type="date"
                {...register('startDate', { required: '시작일을 선택하세요' })}
                error={errors.startDate?.message}
              />

              <Input
                label="종료일"
                type="date"
                {...register('endDate', { required: '종료일을 선택하세요' })}
                error={errors.endDate?.message}
              />
            </div>
          </Card>

          <Card title="메모">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              {...register('memo')}
            />
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              저장
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
