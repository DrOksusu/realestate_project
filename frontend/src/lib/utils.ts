// 숫자 포맷팅 (천단위 콤마)
export const formatNumber = (num: number | string): string => {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('ko-KR');
};

// 금액 포맷팅 (원)
export const formatCurrency = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${n.toLocaleString('ko-KR')}원`;
};

// 금액 포맷팅 (만원)
export const formatCurrencyMan = (amount: number | string): string => {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  const man = n / 10000;
  if (man >= 10000) {
    const eok = man / 10000;
    return `${eok.toFixed(2)}억원`;
  }
  return `${formatNumber(Math.round(man))}만원`;
};

// 날짜 포맷팅
export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// 물건 유형 라벨
export const propertyTypeLabels: Record<string, string> = {
  APARTMENT: '아파트',
  OFFICETEL: '오피스텔',
  VILLA: '빌라/다세대',
  STUDIO: '원룸',
  COMMERCIAL: '상가',
  OFFICE: '사무실',
  BUILDING: '건물',
  LAND: '토지',
  OTHER: '기타',
};

// 물건 상태 라벨
export const propertyStatusLabels: Record<string, string> = {
  OCCUPIED: '임대중',
  VACANT: '공실',
  MAINTENANCE: '수리중',
  FOR_SALE: '매도중',
};

// 물건 상태 색상
export const propertyStatusColors: Record<string, string> = {
  OCCUPIED: 'bg-green-100 text-green-800',
  VACANT: 'bg-red-100 text-red-800',
  MAINTENANCE: 'bg-yellow-100 text-yellow-800',
  FOR_SALE: 'bg-blue-100 text-blue-800',
};

// 임대 유형 라벨
export const leaseTypeLabels: Record<string, string> = {
  JEONSE: '전세',
  MONTHLY: '월세',
  HALF_JEONSE: '반전세',
};

// 계약 상태 라벨
export const leaseStatusLabels: Record<string, string> = {
  ACTIVE: '계약중',
  EXPIRED: '만료',
  TERMINATED: '해지',
  PENDING: '예정',
};

// 납부 상태 라벨
export const paymentStatusLabels: Record<string, string> = {
  PAID: '납부완료',
  PENDING: '미납',
  PARTIAL: '부분납부',
  OVERDUE: '연체',
};

// 납부 상태 색상
export const paymentStatusColors: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PENDING: 'bg-gray-100 text-gray-800',
  PARTIAL: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
};

// 지출 유형 라벨
export const expenseTypeLabels: Record<string, string> = {
  PROPERTY_TAX: '재산세',
  INCOME_TAX: '종합소득세',
  MAINTENANCE: '수선/유지비',
  INSURANCE: '보험료',
  MANAGEMENT_FEE: '관리비',
  LOAN_INTEREST: '대출이자',
  VACANCY_COST: '공실비용',
  AGENT_FEE: '중개수수료',
  OTHER: '기타',
};
