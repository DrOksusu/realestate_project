'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { leaseApi } from '@/lib/api';
import { Lease } from '@/types';
import { formatCurrencyMan, formatCurrency, formatDate, leaseTypeLabels, leaseStatusLabels } from '@/lib/utils';

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadLeases();
  }, [filter]);

  const loadLeases = async () => {
    try {
      const params = filter ? { status: filter } : undefined;
      const response = await leaseApi.getAll(params);
      setLeases(response.data);
    } catch (error) {
      console.error('Failed to load leases:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">계약 관리</h1>
          <Link href="/leases/new">
            <Button>+ 등록</Button>
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: '', label: '전체' },
            { value: 'ACTIVE', label: '계약중' },
            { value: 'PENDING', label: '예정' },
            { value: 'EXPIRED', label: '만료' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                filter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : leases.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>등록된 계약이 없습니다.</p>
              <Link href="/leases/new" className="text-blue-600 hover:underline mt-2 inline-block">
                계약 등록하기
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {leases.map((lease) => (
              <Link key={lease.id} href={`/leases/${lease.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{lease.property?.name}</h3>
                        <Badge variant={lease.status === 'ACTIVE' ? 'success' : 'default'}>
                          {leaseStatusLabels[lease.status]}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">임차인: {lease.tenant?.name}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>{leaseTypeLabels[lease.leaseType]}</span>
                        <span>
                          {formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">보증금 {formatCurrencyMan(lease.deposit)}</div>
                      {lease.leaseType !== 'JEONSE' && (
                        <div className="text-sm text-gray-500">
                          월세 {formatCurrency(lease.monthlyRent)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
