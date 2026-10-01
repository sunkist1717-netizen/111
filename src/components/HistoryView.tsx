import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  GitCommit,
  FileText,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  User,
  Tag,
  ArrowRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { Task, WeekInfo, AppSettings } from '../types/report';
import { getWeeksForMonth, getAvailableMonths, formatDateRange } from '../utils/dateUtils';

interface HistoryViewProps {
  tasks: Task[];
  settings: AppSettings;
  onSelectWeekToView: (week: WeekInfo) => void;
  onNavigateTab: (tab: any) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  tasks,
  settings,
  onSelectWeekToView,
  onNavigateTab,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'archive'>('timeline');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const allRecordedWeekIds = Array.from(
    new Set(tasks.flatMap((t) => Object.keys(t.weeklyRecords)))
  ).sort();

  const taskWeekRecords = selectedTask
    ? Object.entries(selectedTask.weeklyRecords)
        .map(([weekId, record]) => ({
          weekId,
          record,
        }))
        .sort((a, b) => a.weekId.localeCompare(b.weekId))
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              업무 히스토리 아카이브
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            보고서 이력 및 과제별 타임라인
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            과거 주간·월간 보고서를 다시 확인하거나, 한 과제의 주차별 실적 흐름을 시계열로 추적합니다.
          </p>
        </div>

        {/* Sub-tab switcher */}
        <div className="inline-flex bg-[#EFE8E0] p-1.5 rounded-xl border border-[#DDD3C7]">
          <button
            onClick={() => setActiveSubTab('timeline')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'timeline'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <GitCommit className="w-3.5 h-3.5" />
            과제별 실적 타임라인
          </button>
          <button
            onClick={() => setActiveSubTab('archive')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'archive'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            주차별 보고서 보관함
          </button>
        </div>
      </div>

      {activeSubTab === 'timeline' ? (
        /* Timeline View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Task Selector Sidebar */}
          <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-4 space-y-3">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-2">
              조회할 과제 선택 ({tasks.length}건)
            </h3>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
              {tasks.map((task) => {
                const isSelected = task.id === selectedTaskId;
                const recCount = Object.keys(task.weeklyRecords).length;

                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#F5ECE1] border-rose-400 ring-1 ring-rose-300 text-stone-900'
                        : 'bg-white border-[#E8DFD5] hover:bg-[#FAF6F1] text-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-semibold text-stone-600 bg-[#EFE7DE] px-1.5 py-0.5 rounded">
                        {task.category}
                      </span>
                      <span className="font-bold text-rose-700">진척 {task.progress}%</span>
                    </div>
                    <div className="font-bold text-sm line-clamp-1">{task.title}</div>
                    <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
                      <span>담당: {task.assignee}</span>
                      <span className="text-[11px] text-stone-400">기록 {recCount}주차</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Chronological Timeline Stream */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTask ? (
              <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6">
                {/* Task Details Header */}
                <div className="border-b border-[#E8DFD5] pb-5 mb-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold bg-[#EFE7DE] text-stone-800 px-2 py-0.5 rounded border border-[#E0D3C4]">
                      {selectedTask.category}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        selectedTask.status === 'delayed'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : selectedTask.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                      }`}
                    >
                      {selectedTask.status === 'delayed'
                        ? '지연'
                        : selectedTask.status === 'completed'
                        ? '완료'
                        : '정상'}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-stone-900">
                    {selectedTask.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-stone-500 mt-2">
                    <span>담당자: <strong>{selectedTask.assignee}</strong></span>
                    <span>•</span>
                    <span>일정: {selectedTask.startDate} ~ {selectedTask.endDate}</span>
                    <span>•</span>
                    <span>최종 진척률: <strong className="text-rose-700">{selectedTask.progress}%</strong></span>
                  </div>
                </div>

                {/* Timeline Stream */}
                {taskWeekRecords.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    이 과제에 등록된 주차별 실적 기록이 없습니다.
                  </div>
                ) : (
                  <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#E2D6CA]">
                    {taskWeekRecords.map((item, idx) => {
                      const rec = item.record;
                      const isLast = idx === taskWeekRecords.length - 1;

                      return (
                        <div key={item.weekId} className="relative group">
                          {/* Dot on line */}
                          <div
                            className={`absolute -left-[19px] top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                              rec.status === 'delayed'
                                ? 'bg-rose-500'
                                : rec.status === 'completed'
                                ? 'bg-emerald-500'
                                : 'bg-stone-700'
                            }`}
                          />

                          {/* Content Box */}
                          <div className="bg-[#FAF7F2] rounded-xl p-5 border border-[#E8DFD5] space-y-3">
                            <div className="flex items-center justify-between border-b border-[#E8DFD5] pb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-sm text-stone-900">
                                  {item.weekId} 주차
                                </span>
                                {isLast && (
                                  <span className="text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 px-1.5 py-0.2 rounded">
                                    최신 기록
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="font-bold text-rose-700">진척 {rec.progress}%</span>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                    rec.status === 'delayed'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : rec.status === 'completed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-sky-50 text-sky-700 border-sky-200'
                                  }`}
                                >
                                  {rec.status === 'delayed' ? '지연' : rec.status === 'completed' ? '완료' : '정상'}
                                </span>
                              </div>
                            </div>

                            {rec.thisWeekWork && (
                              <div>
                                <span className="text-xs font-bold text-stone-700 block mb-1">
                                  ✓ 주간 실적:
                                </span>
                                <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed pl-2 font-mono">
                                  {rec.thisWeekWork}
                                </p>
                              </div>
                            )}

                            {rec.nextWeekPlan && (
                              <div>
                                <span className="text-xs font-bold text-amber-800 block mb-1">
                                  → 차주 계획:
                                </span>
                                <p className="text-xs text-stone-800 whitespace-pre-line leading-relaxed pl-2 font-mono">
                                  {rec.nextWeekPlan}
                                </p>
                              </div>
                            )}

                            {rec.issues && rec.issues.trim() && (
                              <div className="bg-[#FFF9F2] p-2.5 rounded-lg border border-[#F2DECC] text-xs text-[#7A3E1D]">
                                <span className="font-bold block mb-0.5 text-[#8C4620]">
                                  ⚠️ 이슈 및 조치사항:
                                </span>
                                <p>{rec.issues}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-[#E8DFD5] p-12 text-center text-stone-400">
                선택된 과제가 없습니다.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Reports Archive View */
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6">
          <h2 className="text-base font-bold text-stone-900 mb-4">
            주차별 보고서 목록 ({allRecordedWeekIds.length}개 주차)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allRecordedWeekIds.map((weekId) => {
              const [y, m, w] = weekId.split('-');
              const weekLabel = `${y}년 ${m}월 ${w?.replace('W', '')}주차`;
              const status = settings.reportStatusByWeek[weekId] || 'writing';
              const tasksWithRecord = tasks.filter((t) => !!t.weeklyRecords[weekId]);

              return (
                <div
                  key={weekId}
                  className="bg-[#FAF7F2] rounded-xl p-4 border border-[#E8DFD5] hover:border-rose-400 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {weekId}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        status === 'completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {status === 'completed' ? '작성 완료' : '작성 중'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-stone-900">{weekLabel}</h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      작성된 실적: {tasksWithRecord.length}개 과제
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onNavigateTab('weekly-report');
                    }}
                    className="w-full mt-2 py-2 bg-white hover:bg-rose-600 hover:text-white text-stone-700 text-xs font-bold rounded-lg border border-[#DDD2C6] transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    해당 보고서 바로보기
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
