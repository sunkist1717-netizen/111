import React from 'react';
import {
  LayoutDashboard,
  FileEdit,
  FileText,
  CalendarDays,
  History,
  Settings,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { ReportStatus, WeekInfo } from '../types/report';

export type NavTab = 'dashboard' | 'weekly-input' | 'weekly-report' | 'monthly-report' | 'history' | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  currentWeek: WeekInfo;
  teamName: string;
  reportStatus: ReportStatus;
  onToggleReportStatus?: (status: ReportStatus) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  autoSaveStatus: 'saved' | 'saving' | 'idle';
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentWeek,
  teamName,
  reportStatus,
  onToggleReportStatus,
  isOpenMobile,
  onCloseMobile,
  autoSaveStatus,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: '대시보드',
      subLabel: '현황 및 지연 점검',
      icon: LayoutDashboard,
    },
    {
      id: 'weekly-input' as NavTab,
      label: '주간 입력',
      subLabel: '실적·계획·이슈 작성',
      icon: FileEdit,
      badge: '자동승계',
    },
    {
      id: 'weekly-report' as NavTab,
      label: '주간보고서 미리보기',
      subLabel: '표 양식 · 복사 · 엑셀 · 워드',
      icon: FileText,
    },
    {
      id: 'monthly-report' as NavTab,
      label: '월간보고서',
      subLabel: '자동집계 · AI 3줄 요약',
      icon: CalendarDays,
      hasAiBadge: true,
    },
    {
      id: 'history' as NavTab,
      label: '이력 조회 & 타임라인',
      subLabel: '과거 보고서 · 과제 흐름',
      icon: History,
    },
    {
      id: 'settings' as NavTab,
      label: '설정 & 백업',
      subLabel: '항목 · JSON 내보내기/복원',
      icon: Settings,
    },
  ];

  const getStatusBadge = () => {
    switch (reportStatus) {
      case 'completed':
        return { label: '작성 완료', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'writing':
        return { label: '작성 중', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
      default:
        return { label: '작성 전', color: 'bg-stone-200 text-stone-700 border-stone-300', icon: AlertCircle };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  const content = (
    <aside className="w-72 bg-[#F6F1EC] text-stone-800 flex flex-col h-full border-r border-[#E5DAD0] select-none shadow-xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#E5DAD0]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-stone-900">업무보고 자동화</span>
              <span className="text-[10px] uppercase font-bold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded border border-orange-200">
                PRO
              </span>
            </div>
            <p className="text-xs text-stone-500 truncate mt-0.5">{teamName || '사내 업무 시스템'}</p>
          </div>
        </div>

        {/* Current Week Quick Status Banner */}
        <div className="mt-4 p-3 rounded-xl bg-[#EDE5DD] border border-[#DDD2C6] shadow-2xs">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-stone-500 font-medium">이번 주차</span>
            <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full border flex items-center gap-1 ${statusBadge.color}`}>
              <StatusIcon className="w-3 h-3" />
              {statusBadge.label}
            </span>
          </div>
          <div className="text-sm font-bold text-stone-800 truncate">
            {currentWeek.label}
          </div>
          <div className="text-[11px] text-stone-500 mt-0.5 font-medium">
            {currentWeek.startDate.slice(5).replace('-', '.')} ~ {currentWeek.endDate.slice(5).replace('-', '.')}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all relative group ${
                isActive
                  ? 'bg-[#EBDDCF] text-stone-950 font-bold shadow-xs border border-[#DECDBB]'
                  : 'text-stone-600 hover:bg-[#EFE8DF] hover:text-stone-900'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                  isActive ? 'text-orange-600' : 'text-stone-400 group-hover:text-orange-500'
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm truncate">{item.label}</span>
                  {item.hasAiBadge && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-purple-100 text-purple-700 border border-purple-200 flex items-center gap-0.5 shadow-2xs">
                      <Sparkles className="w-2.5 h-2.5" /> AI
                    </span>
                  )}
                  {item.badge && !isActive && (
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-[#E5DCD1] text-stone-700">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div
                  className={`text-[11px] truncate mt-0.5 ${
                    isActive ? 'text-stone-600 font-medium' : 'text-stone-400 group-hover:text-stone-500'
                  }`}
                >
                  {item.subLabel}
                </div>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-stone-700 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Info & Auto-save Status */}
      <div className="p-4 border-t border-[#E5DAD0] bg-[#EFE8E0] text-xs text-stone-500">
        <div className="flex items-center justify-between mb-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] text-stone-700 font-medium">브라우저 로컬 저장</span>
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-[#E4D9CE] text-stone-700 border border-[#D5C9BD] font-medium">
            {autoSaveStatus === 'saving' ? (
              <span className="text-amber-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> 저장 중
              </span>
            ) : (
              <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> 자동 저장됨
              </span>
            )}
          </span>
        </div>
        <div className="text-[10px] text-stone-400 text-center">
          주간 입력 → 주간보고서 & 월간보고서 자동 생성
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">{content}</div>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
