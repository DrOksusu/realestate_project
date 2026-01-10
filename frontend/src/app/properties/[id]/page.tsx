'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { propertyApi } from '@/lib/api';
import { Property } from '@/types';
import Tooltip from '@/components/ui/Tooltip';
import {
  formatCurrencyMan,
  formatCurrency,
  formatDate,
  propertyTypeLabels,
  propertyStatusLabels,
  propertyStatusColors,
  leaseTypeLabels,
  leaseStatusLabels,
} from '@/lib/utils';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const propertyId = Number(params.id);

  useEffect(() => {
    loadProperty();
    loadShareStatus();
  }, [propertyId]);

  const loadProperty = async () => {
    try {
      const response = await propertyApi.getOne(propertyId);
      setProperty(response.data);
    } catch (error) {
      console.error('Failed to load property:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShareStatus = async () => {
    try {
      const response = await propertyApi.getShareStatus(propertyId);
      setShareToken(response.data.shareToken);
    } catch (error) {
      console.error('Failed to load share status:', error);
    }
  };

  const handleCreateShareLink = async () => {
    setIsSharing(true);
    try {
      const response = await propertyApi.createShareLink(propertyId);
      setShareToken(response.data.shareToken);
    } catch (error) {
      console.error('Failed to create share link:', error);
      alert('공유 링크 생성에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRevokeShareLink = async () => {
    try {
      await propertyApi.revokeShareLink(propertyId);
      setShareToken(null);
    } catch (error) {
      console.error('Failed to revoke share link:', error);
      alert('공유 해제에 실패했습니다.');
    }
  };

  const getShareUrl = () => {
    if (typeof window !== 'undefined' && shareToken) {
      return `${window.location.origin}/share/${shareToken}`;
    }
    return '';
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await propertyApi.delete(propertyId);
      router.push('/properties');
    } catch (error) {
      console.error('Failed to delete property:', error);
      alert('삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
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

  if (!property) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-500">부동산을 찾을 수 없습니다.</p>
          <Link href="/properties" className="text-blue-600 hover:underline mt-2 inline-block">
            목록으로 돌아가기
          </Link>
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
              <h1 className="text-2xl font-bold">{property.name}</h1>
              <Badge className={propertyStatusColors[property.status]}>
                {propertyStatusLabels[property.status]}
              </Badge>
            </div>
            <p className="text-gray-500 mt-1">{property.address}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setShowShareModal(true)}>
              공유
            </Button>
            <Link href={`/properties/${propertyId}/edit`}>
              <Button variant="secondary">수정</Button>
            </Link>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
              삭제
            </Button>
          </div>
        </div>

        {/* 임대 수입 요약 */}
        {property.leases && property.leases.length > 0 && (() => {
          const activeLeases = property.leases.filter(l => l.status === 'ACTIVE');
          const totalDeposit = activeLeases.reduce((sum, l) => sum + Number(l.deposit), 0);
          const totalMonthlyRent = activeLeases.reduce((sum, l) => sum + Number(l.monthlyRent), 0);
          const totalManagementFee = activeLeases.reduce((sum, l) => sum + Number(l.managementFee), 0);
          const totalMonthly = totalMonthlyRent + totalManagementFee;
          const totalAnnualRent = totalMonthlyRent * 12;

          return (
            <Card title="임대 수입 요약">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500">총 보증금</div>
                  <div className="font-bold text-xl text-green-600">{formatCurrencyMan(totalDeposit)}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500">월 임대료</div>
                  <div className="font-bold text-xl text-blue-600">{formatCurrency(totalMonthlyRent)}</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500">월 관리비</div>
                  <div className="font-bold text-xl text-purple-600">{formatCurrency(totalManagementFee)}</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                  <div className="text-sm text-gray-500">월 총수입</div>
                  <div className="font-bold text-xl text-orange-600">{formatCurrency(totalMonthly)}</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">연간 임대 수입 (관리비 제외)</span>
                  <span className="font-bold text-lg">{formatCurrencyMan(totalAnnualRent)}</span>
                </div>
              </div>
            </Card>
          );
        })()}

        {/* 기본 정보 */}
        <Card title="기본 정보">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">물건 유형</div>
              <div className="font-medium">{propertyTypeLabels[property.propertyType]}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">면적</div>
              <div className="font-medium">{property.area}㎡</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">매입일</div>
              <div className="font-medium">{formatDate(property.purchaseDate)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">상세주소</div>
              <div className="font-medium">{property.addressDetail || '-'}</div>
            </div>
          </div>
        </Card>

        {/* 재무 정보 */}
        <Card title="재무 정보">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">매입가</div>
              <div className="font-semibold text-lg">{formatCurrencyMan(property.purchasePrice)}</div>
            </div>
            <Tooltip
              position="bottom"
              content={
                <div className="text-left space-y-1">
                  <div className="font-semibold border-b border-gray-600 pb-1 mb-1">취득부대비용 내역 (추정)</div>
                  <div className="flex justify-between gap-4">
                    <span>취득세 (4.6%)</span>
                    <span>{formatCurrencyMan(Number(property.purchasePrice) * 0.046)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>중개수수료 (0.9%)</span>
                    <span>{formatCurrencyMan(Number(property.purchasePrice) * 0.009)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>법무사/등기비용</span>
                    <span>~100만원</span>
                  </div>
                  <div className="border-t border-gray-600 pt-1 mt-1 flex justify-between gap-4 font-semibold">
                    <span>실제 입력값</span>
                    <span>{formatCurrencyMan(property.acquisitionCost)}</span>
                  </div>
                </div>
              }
            >
              <div className="p-3 bg-gray-50 rounded-lg cursor-help hover:bg-gray-100 transition-colors">
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  취득부대비용
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="font-semibold text-lg">{formatCurrencyMan(property.acquisitionCost)}</div>
              </div>
            </Tooltip>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500">현재 시세</div>
              <div className="font-semibold text-lg">
                {formatCurrencyMan(property.currentValue || property.purchasePrice)}
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">대출금</div>
              <div className="font-semibold text-lg">{formatCurrencyMan(property.loanAmount)}</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-gray-500">대출이자율</div>
              <div className="font-semibold text-lg">{property.loanInterestRate}%</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-500">자기자본</div>
              <div className="font-semibold text-lg text-green-600">
                {formatCurrencyMan(
                  Number(property.purchasePrice) +
                    Number(property.acquisitionCost) -
                    Number(property.loanAmount)
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 임대 계약 */}
        <Card
          title="임대 계약"
          action={
            <Link href={`/leases/new?propertyId=${propertyId}`}>
              <Button size="sm">+ 계약 등록</Button>
            </Link>
          }
        >
          {property.leases && property.leases.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left">
                    <th className="py-3 px-2 font-medium text-gray-500">층수</th>
                    <th className="py-3 px-2 font-medium text-gray-500">면적(평)</th>
                    <th className="py-3 px-2 font-medium text-gray-500">임차인</th>
                    <th className="py-3 px-2 font-medium text-gray-500">유형</th>
                    <th className="py-3 px-2 font-medium text-gray-500 text-right">보증금</th>
                    <th className="py-3 px-2 font-medium text-gray-500 text-right">월세</th>
                    <th className="py-3 px-2 font-medium text-gray-500 text-right">관리비</th>
                    <th className="py-3 px-2 font-medium text-gray-500 text-right">부가세</th>
                    <th className="py-3 px-2 font-medium text-gray-500 text-right">월 합계</th>
                    <th className="py-3 px-2 font-medium text-gray-500">계약기간</th>
                    <th className="py-3 px-2 font-medium text-gray-500">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {property.leases.map((lease) => {
                    const monthlyRent = Number(lease.monthlyRent);
                    const managementFee = Number(lease.managementFee);
                    const vat = lease.hasVat ? Math.round((monthlyRent + managementFee) * 0.1) : 0;
                    const monthlyTotal = monthlyRent + managementFee + vat;

                    return (
                      <tr
                        key={lease.id}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        onClick={() => router.push(`/leases/${lease.id}`)}
                      >
                        <td className="py-3 px-2">{lease.floor || '-'}</td>
                        <td className="py-3 px-2">{lease.areaPyeong ? `${lease.areaPyeong}평` : '-'}</td>
                        <td className="py-3 px-2 font-medium">{lease.tenant?.name}</td>
                        <td className="py-3 px-2">
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                            {leaseTypeLabels[lease.leaseType]}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right">{formatCurrencyMan(lease.deposit)}</td>
                        <td className="py-3 px-2 text-right">
                          {lease.leaseType === 'JEONSE' ? '-' : formatCurrency(monthlyRent)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          {lease.leaseType === 'JEONSE' ? '-' : formatCurrency(managementFee)}
                        </td>
                        <td className="py-3 px-2 text-right text-orange-600">
                          {lease.hasVat ? formatCurrency(vat) : '-'}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-blue-600">
                          {lease.leaseType === 'JEONSE' ? '-' : formatCurrency(monthlyTotal)}
                        </td>
                        <td className="py-3 px-2 text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(lease.startDate).slice(2)} ~ {formatDate(lease.endDate).slice(2)}
                        </td>
                        <td className="py-3 px-2">
                          <Badge variant={lease.status === 'ACTIVE' ? 'success' : 'default'}>
                            {leaseStatusLabels[lease.status]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              등록된 계약이 없습니다.
            </div>
          )}
        </Card>

        {/* 메모 */}
        {property.memo && (
          <Card title="메모">
            <p className="whitespace-pre-wrap text-gray-700">{property.memo}</p>
          </Card>
        )}

        {/* 빠른 액션 */}
        <div className="flex gap-3">
          <Link href={`/valuations?propertyId=${propertyId}`} className="flex-1">
            <Button variant="secondary" className="w-full">수익률 분석</Button>
          </Link>
          <Link href={`/expenses?propertyId=${propertyId}`} className="flex-1">
            <Button variant="secondary" className="w-full">지출 내역</Button>
          </Link>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="부동산 삭제">
        <div className="space-y-4">
          <p className="text-gray-600">
            &quot;{property.name}&quot;을(를) 삭제하시겠습니까?
            <br />
            관련된 모든 계약, 납부내역, 지출내역이 함께 삭제됩니다.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              취소
            </Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={isDeleting}>
              삭제
            </Button>
          </div>
        </div>
      </Modal>

      {/* 공유 모달 */}
      <Modal isOpen={showShareModal} onClose={() => setShowShareModal(false)} title="페이지 공유">
        <div className="space-y-4">
          {shareToken ? (
            <>
              <p className="text-gray-600">
                아래 링크를 통해 이 매물 정보와 수익률 분석을 공유할 수 있습니다.
                <br />
                <span className="text-sm text-gray-500">(로그인 없이 읽기 전용으로 열람 가능)</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getShareUrl()}
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
                />
                <Button onClick={handleCopyLink}>
                  {copied ? '복사됨!' : '복사'}
                </Button>
              </div>
              <Button
                variant="danger"
                className="w-full"
                onClick={handleRevokeShareLink}
              >
                공유 해제
              </Button>
            </>
          ) : (
            <>
              <p className="text-gray-600">
                공유 링크를 생성하면 로그인 없이 매물 정보와 수익률 분석을 열람할 수 있습니다.
              </p>
              <Button
                className="w-full"
                onClick={handleCreateShareLink}
                isLoading={isSharing}
              >
                공유 링크 생성
              </Button>
            </>
          )}
        </div>
      </Modal>
    </Layout>
  );
}
