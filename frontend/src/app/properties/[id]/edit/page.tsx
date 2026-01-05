'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { propertyApi } from '@/lib/api';
import { Property } from '@/types';
import { propertyTypeLabels, propertyStatusLabels } from '@/lib/utils';

interface PropertyForm {
  name: string;
  propertyType: string;
  address: string;
  addressDetail: string;
  area: number;
  purchasePrice: number;
  purchaseDate: string;
  acquisitionCost: number;
  loanAmount: number;
  loanInterestRate: number;
  currentValue: number;
  status: string;
  memo: string;
}

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  const propertyId = Number(params.id);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PropertyForm>();

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const response = await propertyApi.getOne(propertyId);
      const property: Property = response.data;
      reset({
        name: property.name,
        propertyType: property.propertyType,
        address: property.address,
        addressDetail: property.addressDetail || '',
        area: property.area,
        purchasePrice: property.purchasePrice,
        purchaseDate: property.purchaseDate.split('T')[0],
        acquisitionCost: property.acquisitionCost,
        loanAmount: property.loanAmount,
        loanInterestRate: property.loanInterestRate,
        currentValue: property.currentValue || 0,
        status: property.status,
        memo: property.memo || '',
      });
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const onSubmit = async (data: PropertyForm) => {
    setIsLoading(true);
    setError('');

    try {
      await propertyApi.update(propertyId, {
        ...data,
        area: Number(data.area),
        purchasePrice: Number(data.purchasePrice),
        acquisitionCost: Number(data.acquisitionCost) || 0,
        loanAmount: Number(data.loanAmount) || 0,
        loanInterestRate: Number(data.loanInterestRate) || 0,
        currentValue: data.currentValue ? Number(data.currentValue) : undefined,
      });
      router.push(`/properties/${propertyId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || '수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const propertyTypeOptions = Object.entries(propertyTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const statusOptions = Object.entries(propertyStatusLabels).map(([value, label]) => ({
    value,
    label,
  }));

  if (isFetching) {
    return (
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">부동산 수정</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card title="기본 정보">
            <div className="space-y-4">
              <Input
                label="물건명"
                {...register('name', { required: '물건명을 입력하세요' })}
                error={errors.name?.message}
              />

              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="물건 유형"
                  options={propertyTypeOptions}
                  {...register('propertyType')}
                />
                <Select
                  label="상태"
                  options={statusOptions}
                  {...register('status')}
                />
              </div>

              <Input
                label="주소"
                {...register('address', { required: '주소를 입력하세요' })}
                error={errors.address?.message}
              />

              <Input
                label="상세주소"
                {...register('addressDetail')}
              />

              <Input
                label="면적 (㎡)"
                type="number"
                step="0.01"
                {...register('area', { required: '면적을 입력하세요' })}
                error={errors.area?.message}
              />
            </div>
          </Card>

          <Card title="매입 정보">
            <div className="space-y-4">
              <Input
                label="매입가 (원)"
                type="number"
                {...register('purchasePrice', { required: '매입가를 입력하세요' })}
                error={errors.purchasePrice?.message}
              />

              <Input
                label="매입일"
                type="date"
                {...register('purchaseDate', { required: '매입일을 선택하세요' })}
                error={errors.purchaseDate?.message}
              />

              <Input
                label="취득부대비용 (원)"
                type="number"
                {...register('acquisitionCost')}
              />

              <Input
                label="현재 시세 (원)"
                type="number"
                {...register('currentValue')}
              />
            </div>
          </Card>

          <Card title="대출 정보">
            <div className="space-y-4">
              <Input
                label="대출금액 (원)"
                type="number"
                {...register('loanAmount')}
              />

              <Input
                label="대출 이자율 (%)"
                type="number"
                step="0.01"
                {...register('loanInterestRate')}
              />
            </div>
          </Card>

          <Card title="메모">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              {...register('memo')}
            />
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              저장
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
