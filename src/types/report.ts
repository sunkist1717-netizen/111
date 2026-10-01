export type TaskStatus = 'normal' | 'delayed' | 'completed' | 'hold';

export interface WeeklyRecord {
  thisWeekWork: string;      // 금주 실적
  nextWeekPlan: string;      // 차주 계획
  issues: string;            // 이슈 및 요청사항
  progress: number;          // 해당 주차 진척률 (0~100)
  status: TaskStatus;        // 해당 주차 상태
  updatedAt?: string;
}

export interface Task {
  id: string;
  category: string;          // 카테고리 (예: 시스템 개선, 운영, 기획 등)
  title: string;             // 과제명
  assignee: string;          // 담당자
  startDate: string;         // 시작일 (YYYY-MM-DD)
  endDate: string;           // 종료일 (YYYY-MM-DD)
  status: TaskStatus;        // 현재 상태
  progress: number;          // 현재 진척률 (0~100)
  weeklyRecords: Record<string, WeeklyRecord>; // key: weekId (e.g., '2026-W40')
  monthlySummaries?: Record<string, {
    summary: string;
    nextMonthPlan: string;
    updatedAt?: string;
  }>; // key: monthId (e.g., '2026-10')
  createdAt: string;
  updatedAt: string;
}

export interface WeekInfo {
  id: string;                // e.g. "2026-W40"
  year: number;
  month: number;             // 1 ~ 12
  weekNumber: number;        // 해당 월의 N주차 (1~5)
  label: string;             // "2026년 10월 1주차"
  shortLabel: string;        // "10월 1주차"
  startDate: string;         // YYYY-MM-DD (월요일)
  endDate: string;           // YYYY-MM-DD (금요일)
}

export type ReportStatus = 'before' | 'writing' | 'completed';

export interface VisibleColumns {
  category: boolean;
  assignee: boolean;
  period: boolean;
  thisWeekWork: boolean;
  nextWeekPlan: boolean;
  progress: boolean;
  status: boolean;
  issues: boolean;
}

export interface AppSettings {
  teamName: string;
  reportTitleFormat: string;
  categories: string[];
  assignees: string[];
  visibleColumns: VisibleColumns;
  reportStatusByWeek: Record<string, ReportStatus>;
  monthlyOverviews: Record<string, string>; // monthId -> AI executive summary
}

export interface AppData {
  tasks: Task[];
  settings: AppSettings;
  version: number;
  lastUpdated: string;
}
