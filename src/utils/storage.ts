import { AppData, AppSettings, Task } from '../types/report';
import { getCurrentWeekInfo } from './dateUtils';

const STORAGE_KEY = 'work_report_automation_data_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  teamName: '디지털혁신팀',
  reportTitleFormat: '{teamName} 주간 업무 보고',
  categories: ['시스템 개선', '인프라', '기획', '운영', '데이터 분석'],
  assignees: ['김수현 책임', '박민우 수석', '이지은 팀장', '최준호 책임', '정다은 선임'],
  visibleColumns: {
    category: true,
    assignee: true,
    period: true,
    thisWeekWork: true,
    nextWeekPlan: true,
    progress: true,
    status: true,
    issues: true,
  },
  reportStatusByWeek: {
    '2026-09-W4': 'completed',
    '2026-10-W1': 'writing',
  },
  monthlyOverviews: {},
};

export const INITIAL_SAMPLE_TASKS: Task[] = [
  {
    id: 'task-sample-1',
    category: '시스템 개선',
    title: '차세대 ERP 연동 및 결재 API 고도화',
    assignee: '김수현 책임',
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    status: 'normal',
    progress: 75,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-30T10:00:00.000Z',
    weeklyRecords: {
      '2026-09-W4': {
        thisWeekWork: '- 사내 결재 시스템 연동 인터페이스 스펙 정의 및 DB 스키마 설계\n- RESTful API 게이트웨이 인증 토큰 연동 1차 모듈 개발 완료',
        nextWeekPlan: '- ERP 재무/인사 데이터 매핑 테이블 검증 및 결재 프로세스 통합 테스트\n- 실무 부서 피드백 수렴 및 예외 처리 로직 추가',
        issues: '부서별 결재선 커스텀 필드 규격 협의 필요 (10/02 경영지원팀 미팅 예정)',
        progress: 60,
        status: 'normal',
      },
      '2026-10-W1': {
        thisWeekWork: '- ERP 재무/인사 데이터 매핑 테이블 검증 및 결재 프로세스 통합 테스트 진행\n- 결재 승인/반려 시 실시간 웹훅 알림 기능 연동 완료',
        nextWeekPlan: '- 전사 파일럿 부서 대상 1차 오픈 및 사용자 테스트(UAT)\n- 동시접속 부하 테스트(목표 300 TPS) 실시',
        issues: '실무 부서 인터페이스 검증 완료, 특이사항 없음',
        progress: 75,
        status: 'normal',
      },
    },
    monthlySummaries: {
      '2026-09': {
        summary: '- 차세대 ERP 인터페이스 표준 규격 수립 및 게이트웨이 모듈 1차 개발 완료\n- 재무·인사 부서 핵심 데이터 매핑 및 결재 프로세스 테스트 착수\n- 부서 협의를 거쳐 커스텀 결재선 스펙 확정',
        nextMonthPlan: '- 10월 중 파일럿 부서 오픈 및 UAT 완료 후 전사 확대 준비',
        updatedAt: '2026-09-30T18:00:00.000Z',
      },
    },
  },
  {
    id: 'task-sample-2',
    category: '인프라',
    title: '클라우드 재해복구(DR) 모의훈련 및 백업 체계 자동화',
    assignee: '박민우 수석',
    startDate: '2026-09-01',
    endDate: '2026-10-24',
    status: 'delayed',
    progress: 50,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-30T11:30:00.000Z',
    weeklyRecords: {
      '2026-09-W4': {
        thisWeekWork: '- DR 리전 스토리지 스냅샷 자동 복제 스크립트 작성 및 배포\n- 모의 전환 시나리오 1차 가이드라인 초안 작성',
        nextWeekPlan: '- DB 복제 지연시간(RPO) 5분 이내 달성 검증 테스트\n- 사내 망분리 방화벽 정책 예외 신청 및 승인 완료',
        issues: '정보보안팀 방화벽 보안성 심의 일정 지연으로 검증 대기 발생',
        progress: 40,
        status: 'delayed',
      },
      '2026-10-W1': {
        thisWeekWork: '- 정보보안팀 긴급 협의를 통한 방화벽 정책 조건부 승인 득함\n- DR 서버 기동 자동화 Ansible 플레이북 1차 작성 완료',
        nextWeekPlan: '- DB 복제 지연시간(RPO) 실측 테스트 및 failover 소요시간(RTO) 측정\n- DR 모의훈련 시나리오 2차 리허설 및 보고서 작성',
        issues: '방화벽 심의 지연 여파로 전체 일정 약 1주일 순연 중 (차주 집중 작업으로 만회 계획)',
        progress: 50,
        status: 'delayed',
      },
    },
  },
  {
    id: 'task-sample-3',
    category: '기획',
    title: '2026 하반기 전사 업무 생산성 혁신 전략 수립',
    assignee: '이지은 팀장',
    startDate: '2026-09-15',
    endDate: '2026-10-15',
    status: 'normal',
    progress: 85,
    createdAt: '2026-09-15T09:00:00.000Z',
    updatedAt: '2026-09-30T14:00:00.000Z',
    weeklyRecords: {
      '2026-09-W4': {
        thisWeekWork: '- 전 부서 대상 수작업 업무 설문조사 취합 및 분석 (응답률 92%)\n- 자동화 대상 우선순위 TOP 5 과제 선정 완료',
        nextWeekPlan: '- 임원진 보고용 생산성 혁신 전략 프레임워크 작성\n- 부서별 맞춤형 자동화 솔루션 도입 ROI 추정치 산출',
        issues: '특이사항 없음',
        progress: 65,
        status: 'normal',
      },
      '2026-10-W1': {
        thisWeekWork: '- 임원진 보고용 전략 프레임워크 및 단계별 로드맵 초안 작성\n- 솔루션 도입에 따른 연간 3,200시간 절감 기대효과 도출',
        nextWeekPlan: '- 10월 2주차 경영회의 최종 안건 상정 및 경영진 보고\n- Q4 파일럿 적용 부서 3개 팀 최종 섭외 완료',
        issues: '경영회의 일정(10/08) 확정에 따른 보고 자료 최종 감수 진행',
        progress: 85,
        status: 'normal',
      },
    },
  },
  {
    id: 'task-sample-4',
    category: '운영',
    title: 'Q3 정보보호 정기 감사 대응 및 계정 권한 전수 점검',
    assignee: '최준호 책임',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    status: 'completed',
    progress: 100,
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-30T17:00:00.000Z',
    weeklyRecords: {
      '2026-09-W4': {
        thisWeekWork: '- 퇴사자 및 휴직자 계정 회수 100% 완료 점검\n- 특권 계정(DBA, root) 접근 감사 로그 분석 보고서 제출',
        nextWeekPlan: '- 외부 감사관 지적사항 0건 확인 및 최종 감사 종결 보고',
        issues: '감사 지적사항 무결점 달성',
        progress: 100,
        status: 'completed',
      },
    },
  },
];

export function loadAppData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initialData: AppData = {
        tasks: INITIAL_SAMPLE_TASKS,
        settings: DEFAULT_SETTINGS,
        version: 1,
        lastUpdated: new Date().toISOString(),
      };
      saveAppData(initialData);
      return initialData;
    }
    const parsed = JSON.parse(raw);
    return {
      tasks: parsed.tasks || [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      version: parsed.version || 1,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (e) {
    console.error('Failed to load data from localStorage', e);
    return {
      tasks: INITIAL_SAMPLE_TASKS,
      settings: DEFAULT_SETTINGS,
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function saveAppData(data: AppData): void {
  try {
    data.lastUpdated = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data to localStorage', e);
  }
}

export function exportAppDataJson(): void {
  const data = loadAppData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `업무보고_데이터백업_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importAppDataJson(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('유효하지 않은 데이터 백업 파일입니다.');
        }
        saveAppData({
          tasks: parsed.tasks,
          settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
          version: parsed.version || 1,
          lastUpdated: new Date().toISOString(),
        });
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsText(file);
  });
}

export function resetToSampleData(): AppData {
  const initialData: AppData = {
    tasks: INITIAL_SAMPLE_TASKS,
    settings: DEFAULT_SETTINGS,
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
  saveAppData(initialData);
  return initialData;
}

export function clearAllData(): AppData {
  const emptyData: AppData = {
    tasks: [],
    settings: DEFAULT_SETTINGS,
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
  saveAppData(emptyData);
  return emptyData;
}
