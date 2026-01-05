'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { propertyApi } from '@/lib/api';
import { Property } from '@/types';
import {
  formatCurrencyMan,
  propertyTypeLabels,
  propertyStatusLabels,
  propertyStatusColors,
} from '@/lib/utils';

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');

  useEffect(() => {
    loadProperties();
  }, [filter]);

  const loadProperties = async () => {
    try {
      const params = filter ? { status: filter } : undefined;
      const response = await propertyApi.getAll(params);
      setProperties(response.data);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">부동산 관리</h1>
          <Link href="/properties/new">
            <Button>+ 등록</Button>
          </Link>
        </div>

        {/* 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { value: '', label: '전체' },
            { value: 'OCCUPIED', label: '임대중' },
            { value: 'VACANT', label: '공실' },
            { value: 'FOR_SALE', label: '매도중' },
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

        {/* 목록 */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : properties.length === 0 ? (
          <Card>
            <div className="text-center py-8 text-gray-500">
              <p>등록된 부동산이 없습니다.</p>
              <Link href="/properties/new" className="text-blue-600 hover:underline mt-2 inline-block">
                부동산 등록하기
              </Link>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {properties.map((property) => (
              <Link key={property.id} href={`/properties/${property.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{property.name}</h3>
                        <Badge className={propertyStatusColors[property.status]}>
                          {propertyStatusLabels[property.status]}
                        </Badge>
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{property.address}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                        <span>{propertyTypeLabels[property.propertyType]}</span>
                        <span>{property.area}㎡</span>
                        {property.leases && property.leases.length > 0 && (
                          <span>계약 {property.leases.length}건</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrencyMan(property.currentValue || property.purchasePrice)}
                      </div>
                      <div className="text-sm text-gray-500">
                        매입가 {formatCurrencyMan(property.purchasePrice)}
                      </div>
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
