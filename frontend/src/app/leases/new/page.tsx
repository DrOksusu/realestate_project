'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { useForm } from 'react-hook-form';
import { leaseApi, propertyApi, tenantApi } from '@/lib/api';
import { Property, Tenant } from '@/types';
import { leaseTypeLabels } from '@/lib/utils';

interface LeaseForm {
  propertyId: number;
  tenantId: number;
  leaseType: string;
  deposit: number;
  monthlyRent: number;
  managementFee: number;
  startDate: string;
  endDate: string;
  rentDueDay: number;
  memo: string;
}

function NewLeaseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const defaultPropertyId = searchParams.get('propertyId');

  const { register, handleSubmit, watch, formState: { errors } } = useForm<LeaseForm>({
    defaultValues: {
      propertyId: defaultPropertyId ? Number(defaultPropertyId) : 0,
      leaseType: 'MONTHLY',
      monthlyRent: 0,
      managementFee: 0,
      rentDueDay: 1,
    },
  });

  const leaseType = watch('leaseType');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [propertiesRes, tenantsRes] = await Promise.all([
        propertyApi.getAll(),
        tenantApi.getAll(),
      ]);
      setProperties(propertiesRes.data);
      setTenants(tenantsRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onSubmit = async (data: LeaseForm) => {
    setIsLoading(true);
    setError('');

    try {
      await leaseApi.create({
        ...data,
        propertyId: Number(data.propertyId),
        tenantId: Number(data.tenantId),
        deposit: Number(data.deposit),
        monthlyRent: Number(data.monthlyRent) || 0,
        managementFee: Number(data.managementFee) || 0,
        rentDueDay: Number(data.rentDueDay) || 1,
      });
      router.push('/leases');
    } catch (err: any) {
      setError(err.response?.data?.error || '등록에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const leaseTypeOptions = Object.entries(leaseTypeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const propertyOptions = [
    { value: '0', label: '부동산 선택' },
    ...properties.map((p) => ({ value: String(p.id), label: p.name })),
  ];

  const tenantOptions = [
    { value: '0', label: '임차인 선택' },
    ...tenants.map((t) => ({ value: String(t.id), label: t.name })),
  ];

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">계약 등록</h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <Card title="기본 정보">
            <div className="space-y-4">
              <Select
                label="부동산"
                options={propertyOptions}
                {...register('propertyId', { validate: (v) => v > 0 || '부동산을 선택하세요' })}
                error={errors.propertyId?.message}
              />

              <Select
                label="임차인"
                options={tenantOptions}
                {...register('tenantId', { validate: (v) => v > 0 || '임차인을 선택하세요' })}
                error={errors.tenantId?.message}
              />

              <Select
                label="계약 유형"
                options={leaseTypeOptions}
                {...register('leaseType')}
              />
            </div>
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
            <Button type="submit" className="flex-1" isLoading={isLoading}>
              등록
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default function NewLeasePage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </Layout>
    }>
      <NewLeaseContent />
    </Suspense>
  );
}
