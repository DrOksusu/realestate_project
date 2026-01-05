'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { leaseApi, rentPaymentApi } from '@/lib/api';
import { Lease } from '@/types';
import {
  formatCurrencyMan,
  formatCurrency,
  formatDate,
  leaseTypeLabels,
  leaseStatusLabels,
  paymentStatusLabels,
  paymentStatusColors,
} from '@/lib/utils';

export default function LeaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lease, setLease] = useState<Lease | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaseId = Number(params.id);

  useEffect(() => {
    loadLease();
  }, [leaseId]);

  const loadLease = async () => {
    try {
      const response = await leaseApi.getOne(leaseId);
      setLease(response.data);
    } catch (error) {
      console.error('Failed to load lease:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    setIsSubmitting(true);
    try {
      await leaseApi.updateStatus(leaseId, status);
      setShowStatusModal(false);
      loadLease();
    } catch (error: any) {
      alert(error.response?.data?.error || '상태 변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGeneratePayments = async () => {
    if (!lease) return;
    setIsSubmitting(true);
    try {
      const startDate = new Date(lease.startDate);
      const endDate = new Date(lease.endDate);
      await rentPaymentApi.generate({
        leaseId,
        startYear: startDate.getFullYear(),
        startMonth: startDate.getMonth() + 1,
        endYear: endDate.getFullYear(),
        endMonth: endDate.getMonth() + 1,
      });
      setShowGenerateModal(false);
      loadLease();
      alert('납부 내역이 생성되었습니다.');
    } catch (error: any) {
      alert(error.response?.data?.error || '생성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{lease.property?.name}</h1>
              <Badge variant={lease.status === 'ACTIVE' ? 'success' : 'default'}>
                {leaseStatusLabels[lease.status]}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">임차인: {lease.tenant?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowStatusModal(true)}>
              상태변경
            </Button>
          </div>
        </div>

        {/* 계약 정보 */}
        <Card title="계약 정보">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">계약 유형</div>
              <div className="font-medium">{leaseTypeLabels[lease.leaseType]}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">보증금</div>
              <div className="font-medium">{formatCurrencyMan(lease.deposit)}</div>
            </div>
            {lease.leaseType !== 'JEONSE' && (
              <>
                <div>
                  <div className="text-sm text-gray-500">월세</div>
                  <div className="font-medium">{formatCurrency(lease.monthlyRent)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">관리비</div>
                  <div className="font-medium">{formatCurrency(lease.managementFee)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">납부일</div>
                  <div className="font-medium">매월 {lease.rentDueDay}일</div>
                </div>
              </>
            )}
            <div>
              <div className="text-sm text-gray-500">계약 기간</div>
              <div className="font-medium">
                {formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}
              </div>
            </div>
          </div>
        </Card>

        {/* 납부 내역 */}
        {lease.leaseType !== 'JEONSE' && (
          <Card
            title="납부 내역"
            action={
              <Button size="sm" onClick={() => setShowGenerateModal(true)}>
                일괄 생성
              </Button>
            }
          >
            {lease.rentPayments && lease.rentPayments.length > 0 ? (
              <div className="space-y-2">
                {lease.rentPayments.map((payment) => (
                  <Link
                    key={payment.id}
                    href={`/payments/${payment.id}`}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <div className="font-medium">
                        {payment.paymentYear}년 {payment.paymentMonth}월
                      </div>
                      <div className="text-sm text-gray-500">
                        납부예정일: {formatDate(payment.dueDate)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(payment.totalAmount)}</div>
                      <Badge className={paymentStatusColors[payment.rentStatus]}>
                        {paymentStatusLabels[payment.rentStatus]}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>납부 내역이 없습니다.</p>
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="text-blue-600 hover:underline mt-2"
                >
                  납부 내역 생성하기
                </button>
              </div>
            )}
          </Card>
        )}

        {/* 임차인 정보 */}
        <Card title="임차인 정보">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">이름</span>
              <span className="font-medium">{lease.tenant?.name}</span>
            </div>
            {lease.tenant?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">연락처</span>
                <span className="font-medium">{lease.tenant.phone}</span>
              </div>
            )}
            {lease.tenant?.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">이메일</span>
                <span className="font-medium">{lease.tenant.email}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 상태 변경 모달 */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="계약 상태 변경">
        <div className="space-y-3">
          {['ACTIVE', 'EXPIRED', 'TERMINATED'].map((status) => (
            <button
              key={status}
              onClick={() => handleStatusChange(status)}
              disabled={isSubmitting || lease.status === status}
              className={`w-full p-3 text-left rounded-lg border transition-colors ${
                lease.status === status
                  ? 'bg-blue-50 border-blue-500'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
            >
              {leaseStatusLabels[status as keyof typeof leaseStatusLabels]}
            </button>
          ))}
        </div>
      </Modal>

      {/* 납부 내역 생성 모달 */}
      <Modal isOpen={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="납부 내역 생성">
        <div className="space-y-4">
          <p className="text-gray-600">
            계약 기간({formatDate(lease.startDate)} ~ {formatDate(lease.endDate)}) 동안의 납부 내역을
            자동으로 생성합니다.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowGenerateModal(false)}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleGeneratePayments} isLoading={isSubmitting}>
              생성
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
