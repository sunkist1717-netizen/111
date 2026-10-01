import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  AlertCircle,
  Plus,
  Sparkles,
  ChevronRight,
  Check,
  User,
  Tag
} from 'lucide-react';
import { Task, WeekInfo, ReportStatus } from '../types/report';
import { formatDateRange } from '../utils/dateUtils';

interface DashboardViewProps {
  tasks: Task[];
  currentWeek: WeekInfo;
  reportStatus: ReportStatus;
  onChangeReportStatus: (status: ReportStatus) => void;
  onNavigateTab: (tab: any) => void;
  onOpenNewTaskModal: () => void;
  onSelectTaskToEdit?: (task: Task) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  tasks,
  currentWeek,
  reportStatus,
  onChangeReportStatus,
  onNavigateTab,
  onOpenNewTaskModal,
  onSelectTaskToEdit,
}) => {
  // Compute metrics
  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'hold');
  const delayedTasks = tasks.filter((t) => t.status === 'delayed');

  // Completed this month
  const currentMonthPrefix = `${currentWeek.year}-${String(currentWeek.month).padStart(2, '0')}`;
  const completedThisMonth = tasks.filter((t) => {
    if (t.status !== 'completed') return false;
    return t.endDate.startsWith(currentMonthPrefix) || t.updatedAt.startsWith(currentMonthPrefix);
  });

  // Calculate average progress of active tasks
  const avgProgress = activeTasks.length
    ? Math.round(activeTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / activeTasks.length)
    : 0;

  // Number of tasks with records filled for current week
  const filledThisWeekCount = tasks.filter((t) => {
    const r = t.weeklyRecords[currentWeek.id];
    return r && r.thisWeekWork && r.thisWeekWork.trim().length > 0;
  }).length;

  const inputCompletionRate = tasks.length ? Math.round((filledThisWeekCount / tasks.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Hero Section: Reporting Status for This Week with Vibrant Orange Styling */}
      <div className="bg-gradient-to-r from-[#FFFDF9] via-[#FAF7F2] to-[#FFF7ED] rounded-2xl border-2 border-orange-500 shadow-md shadow-orange-500/10 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-orange-100/40 via-amber-50/20 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                {currentWeek.label}
              </span>
              <span className="text-xs text-stone-600 font-medium">
                ({formatDateRange(currentWeek.startDate, currentWeek.endDate)})
              </span>
            </div>
            <h1 className="text-2xl font-black text-stone-900 tracking-tight">
              이번 주 업무보고 현황
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              주간 실적을 한 번만 입력하면 보고서가 자동으로 조립되며, 이번 주 상태를 즉시 갱신할 수 있습니다.
            </p>
          </div>

          {/* Report status control pills */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="text-xs font-bold text-stone-600">보고서 작성 상태:</span>
            <div className="inline-flex bg-[#EFE8E0] p-1.5 rounded-xl border border-[#DDD3C7]">
              <button
                type="button"
                onClick={() => onChangeReportStatus('before')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  reportStatus === 'before'
                    ? 'bg-stone-700 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                작성 전
              </button>
              <button
                type="button"
                onClick={() => onChangeReportStatus('writing')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  reportStatus === 'writing'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                작성 중
              </button>
              <button
                type="button"
                onClick={() => onChangeReportStatus('completed')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  reportStatus === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                작성 완료
              </button>
            </div>
          </div>
        </div>

        {/* Quick action buttons & Progress bar */}
        <div className="mt-6 pt-5 border-t border-[#EADBCE] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-600 font-medium">
              이번 주 실적 입력 진행률:
            </span>
            <div className="w-36 bg-[#E5DCD1] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${inputCompletionRate}%` }}
              />
            </div>
            <span className="text-xs font-bold text-stone-800">
              {filledThisWeekCount}/{tasks.length}건 ({inputCompletionRate}%)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('weekly-input')}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              주간 실적 입력하기
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateTab('weekly-report')}
              className="px-4 py-2 bg-white hover:bg-[#FAF6F0] text-stone-700 border border-[#D5C7B8] text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-orange-600" />
              주간보고서 보기
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pastel Tone KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Tasks - Pastel Sky */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              진행 중인 과제
            </span>
            <div className="text-2xl font-black text-stone-900 mt-1">
              {activeTasks.length} <span className="text-sm font-normal text-stone-500">건</span>
            </div>
            <span className="text-[11px] text-sky-700 font-semibold mt-1 inline-block">
              전체 {tasks.length}개 과제 중
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Delayed Tasks - Pastel Rose */}
        <div
          className={`p-5 rounded-2xl border shadow-xs flex items-center justify-between transition-all ${
            delayedTasks.length > 0
              ? 'bg-[#FFF7F7] border-rose-300 text-rose-950'
              : 'bg-white border-[#E8DFD5]'
          }`}
        >
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1">
              지연 과제 (주의)
              {delayedTasks.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                delayedTasks.length > 0 ? 'text-rose-600' : 'text-stone-900'
              }`}
            >
              {delayedTasks.length}{' '}
              <span className="text-sm font-normal text-stone-500">건</span>
            </div>
            <span
              className={`text-[11px] font-medium mt-1 inline-block ${
                delayedTasks.length > 0 ? 'text-rose-700 font-bold' : 'text-stone-500'
              }`}
            >
              {delayedTasks.length > 0 ? '집중 점검 및 만회 필요' : '모든 과제 정상 진행 중'}
            </span>
          </div>
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              delayedTasks.length > 0 ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-stone-100 text-stone-500'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Completed This Month - Pastel Sage */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              이번 달 완료 과제
            </span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {completedThisMonth.length}{' '}
              <span className="text-sm font-normal text-stone-500">건</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-semibold mt-1 inline-block">
              {currentWeek.month}월 목표 달성
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Average Progress - Pastel Lavender */}
        <div className="bg-white p-5 rounded-2xl border border-[#E8DFD5] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              진행 과제 평균 진척률
            </span>
            <div className="text-2xl font-black text-purple-800 mt-1">
              {avgProgress}%
            </div>
            <span className="text-[11px] text-purple-700 font-semibold mt-1 inline-block">
              전체 평균 달성도
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Delayed Tasks Highlight Box */}
      {delayedTasks.length > 0 && (
        <div className="bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 border-2 border-rose-300 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-600 text-white">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-950">
                  집중 관리 필요 지연 과제 ({delayedTasks.length}건)
                </h3>
                <p className="text-xs text-rose-700">
                  주간보고 시 사유 및 일정 만회 대책이 명확히 기술되어야 합니다.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('weekly-input')}
              className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-white hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-300 shadow-2xs transition-all flex items-center gap-1"
            >
              입력 화면에서 확인
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {delayedTasks.map((task) => {
              const currentRec = task.weeklyRecords[currentWeek.id];
              return (
                <div
                  key={task.id}
                  className="bg-white rounded-xl p-4 border border-rose-200 shadow-2xs space-y-2 hover:border-rose-400 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded mr-2">
                        {task.category}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">
                        담당: {task.assignee}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {task.title}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-bold bg-rose-600 text-white rounded-full shrink-0">
                      진척률 {task.progress}%
                    </span>
                  </div>

                  {currentRec?.issues && (
                    <div className="text-xs bg-rose-50/70 p-2.5 rounded-lg text-rose-900 border border-rose-200/80">
                      <span className="font-semibold block text-rose-800 mb-0.5">
                        ⚠️ 지연 사유 / 이슈사항:
                      </span>
                      <p className="leading-relaxed">{currentRec.issues}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                    <span>일정: {task.startDate} ~ {task.endDate}</span>
                    <button
                      onClick={() => onNavigateTab('weekly-input')}
                      className="text-rose-600 font-semibold hover:underline flex items-center gap-0.5"
                    >
                      실적·대책 수정
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task List Overview & Reporting Progress Table */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#E8DFD5] bg-[#FAF6F1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-stone-900">
              전체 업무 과제 목록 ({tasks.length}건)
            </h2>
            <p className="text-xs text-stone-500">
              각 과제의 이번 주차 실적 작성 상태와 진척도를 한눈에 확인합니다.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewTaskModal}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              새 과제 추가
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F5EFEB] text-stone-600 text-xs font-semibold uppercase tracking-wider border-b border-[#E8DFD5]">
              <tr>
                <th className="py-3 px-4 text-center w-24">카테고리</th>
                <th className="py-3 px-4">과제명</th>
                <th className="py-3 px-4 text-center w-28">담당자</th>
                <th className="py-3 px-4 text-center w-32">일정</th>
                <th className="py-3 px-4 text-center w-28">진척률</th>
                <th className="py-3 px-4 text-center w-24">상태</th>
                <th className="py-3 px-4 text-center w-32">이번 주 입력</th>
                <th className="py-3 px-4 text-center w-20">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE7DE] text-stone-700">
              {tasks.map((task) => {
                const currentRec = task.weeklyRecords[currentWeek.id];
                const hasFilled = !!(currentRec?.thisWeekWork && currentRec.thisWeekWork.trim());
                const isDelayed = task.status === 'delayed';
                const isCompleted = task.status === 'completed';

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-[#FAF6F1] transition-colors"
                  >
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-md bg-[#F2EAE1] text-stone-800 border border-[#E3D6C8]">
                        {task.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-stone-900 block truncate max-w-xs md:max-w-md">
                        {task.title}
                      </span>
                      {currentRec?.issues && (
                        <span className="text-[11px] text-amber-800 truncate block mt-0.5 font-medium">
                          이슈: {currentRec.issues}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-stone-600">
                      {task.assignee}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-stone-500 whitespace-nowrap">
                      {task.startDate.slice(5)} ~ {task.endDate.slice(5)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#EAE2D8] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : isDelayed
                                ? 'bg-rose-500'
                                : 'bg-stone-700'
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-stone-700 w-8 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-bold rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDelayed
                            ? 'bg-rose-50 text-rose-800 border-rose-300 font-extrabold'
                            : task.status === 'hold'
                            ? 'bg-stone-100 text-stone-600 border-stone-200'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        {task.status === 'completed'
                          ? '완료'
                          : task.status === 'delayed'
                          ? '지연'
                          : task.status === 'hold'
                          ? '보류'
                          : '정상'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasFilled ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Check className="w-3 h-3" />
                          작성완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-md">
                          미입력
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onNavigateTab('weekly-input')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline"
                      >
                        입력
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
