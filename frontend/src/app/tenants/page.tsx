'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { useForm } from 'react-hook-form';
import { tenantApi } from '@/lib/api';
import { Tenant } from '@/types';
import { leaseStatusLabels } from '@/lib/utils';

interface TenantForm {
  name: string;
  phone: string;
  email: string;
  memo: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TenantForm>();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const response = await tenantApi.getAll();
      setTenants(response.data);
    } catch (error) {
      console.error('Failed to load tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      reset({
        name: tenant.name,
        phone: tenant.phone || '',
        email: tenant.email || '',
        memo: tenant.memo || '',
      });
    } else {
      setEditingTenant(null);
      reset({ name: '', phone: '', email: '', memo: '' });
    }
    setShowModal(true);
  };

  const onSubmit = async (data: TenantForm) => {
    setIsSubmitting(true);
    try {
      if (editingTenant) {
        await tenantApi.update(editingTenant.id, data);
      } else {
        await tenantApi.create(data);
      }
      setShowModal(false);
      loadTenants();
    } catch (error: any) {
      alert(error.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('임차인을 삭제하시겠습니까?')) return;
    try {
      await tenantApi.delete(id);
      loadTenants();
    } catch (error: any) {
      alert(error.response?.data?.error || '삭제에 실패했습니다.');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">임차인 관리</h1>
          <Button onClick={() => openModal()}>+ 등록</Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : tenants.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>등록된 임차인이 없습니다.</p>
              <button onClick={() => openModal()} className="text-blue-600 hover:underline mt-2">
                임차인 등록하기
              </button>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <Card key={tenant.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{tenant.name}</h3>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      {tenant.phone && <p>연락처: {tenant.phone}</p>}
                      {tenant.email && <p>이메일: {tenant.email}</p>}
                    </div>
                    {tenant.leases && tenant.leases.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {tenant.leases.map((lease) => (
                          <Link
                            key={lease.id}
                            href={`/leases/${lease.id}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600"
                          >
                            <span>{lease.property?.name}</span>
                            <Badge variant={lease.status === 'ACTIVE' ? 'success' : 'default'}>
                              {leaseStatusLabels[lease.status]}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openModal(tenant)}>
                      수정
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(tenant.id)}>
                      삭제
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTenant ? '임차인 수정' : '임차인 등록'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="이름"
            {...register('name', { required: '이름을 입력하세요' })}
            error={errors.name?.message}
          />
          <Input
            label="연락처"
            type="tel"
            {...register('phone')}
          />
          <Input
            label="이메일"
            type="email"
            {...register('email')}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              {...register('memo')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
              취소
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editingTenant ? '저장' : '등록'}
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
