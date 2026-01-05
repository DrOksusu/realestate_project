'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { propertyApi } from '@/lib/api';
import { propertyTypeLabels } from '@/lib/utils';

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
  memo: string;
}

export default function NewPropertyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<PropertyForm>({
    defaultValues: {
      propertyType: 'APARTMENT',
      acquisitionCost: 0,
      loanAmount: 0,
      loanInterestRate: 0,
    },
  });

  const onSubmit = async (data: PropertyForm) => {
    setIsLoading(true);
    setError('');

    try {
      await propertyApi.create({
        ...data,
        area: Number(data.area),
        purchasePrice: Number(data.purchasePrice),
        acquisitionCost: Number(data.acquisitionCost) || 0,
        loanAmount: Number(data.loanAmount) || 0,
        loanInterestRate: Number(data.loanInterestRate) || 0,
        currentValue: data.currentValue ? Number(data.currentValue) : undefined,
      });
      router.push('/properties');
    } catch (err: any) {
      setError(err.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const propertyTypeOptions = Object.entries(propertyTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">부동산 등록</h1>

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
                placeholder="예: 강남 오피스텔 1호"
                {...register('name', { required: '물건명을 입력하세요' })}
                error={errors.name?.message}
              />

              <Select
                label="물건 유형"
                options={propertyTypeOptions}
                {...register('propertyType')}
              />

              <Input
                label="주소"
                placeholder="주소를 입력하세요"
                {...register('address', { required: '주소를 입력하세요' })}
                error={errors.address?.message}
              />

              <Input
                label="상세주소"
                placeholder="동/호수"
                {...register('addressDetail')}
              />

              <Input
                label="면적 (㎡)"
                type="number"
                step="0.01"
                placeholder="전용면적"
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
                placeholder="매입가를 입력하세요"
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
                placeholder="취득세, 중개수수료 등"
                {...register('acquisitionCost')}
              />

              <Input
                label="현재 시세 (원)"
                type="number"
                placeholder="현재 예상 시세"
                {...register('currentValue')}
              />
            </div>
          </Card>

          <Card title="대출 정보">
            <div className="space-y-4">
              <Input
                label="대출금액 (원)"
                type="number"
                placeholder="대출금액을 입력하세요"
                {...register('loanAmount')}
              />

              <Input
                label="대출 이자율 (%)"
                type="number"
                step="0.01"
                placeholder="연 이자율"
                {...register('loanInterestRate')}
              />
            </div>
          </Card>

          <Card title="메모">
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="메모를 입력하세요"
              {...register('memo')}
            />
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => router.back()}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              등록
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
