import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Copy,
  FileSpreadsheet,
  FileDown,
  Printer,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  RefreshCw,
  Loader2,
  FileText,
  Edit3,
  Bot
} from 'lucide-react';
import { Task, AppSettings, WeekInfo } from '../types/report';
import { getWeeksForMonth, getAvailableMonths } from '../utils/dateUtils';
import {
  copyMonthlyTableToClipboard,
  exportMonthlyToExcel,
  exportMonthlyToWord,
} from '../utils/exportUtils';

interface MonthlyReportViewProps {
  tasks: Task[];
  settings: AppSettings;
  onUpdateMonthlySummary: (taskId: string, monthId: string, summary: string, nextMonthPlan: string) => void;
  onUpdateMonthlyOverview: (monthId: string, overview: string) => void;
}

export const MonthlyReportView: React.FC<MonthlyReportViewProps> = ({
  tasks,
  settings,
  onUpdateMonthlySummary,
  onUpdateMonthlyOverview,
}) => {
  const availableMonths = getAvailableMonths(2026);
  const [selectedMonthId, setSelectedMonthId] = useState<string>('2026-10');
  const [loadingAiMap, setLoadingAiMap] = useState<Record<string, boolean>>({});
  const [loadingOverviewAi, setLoadingOverviewAi] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [localSummaries, setLocalSummaries] = useState<Record<string, { summary: string; nextMonthPlan: string }>>({});
  const [localOverview, setLocalOverview] = useState<string>('');

  const [yearStr, monthStr] = selectedMonthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const monthLabel = `${year}년 ${month}월`;

  const weeksInMonth = getWeeksForMonth(year, month);

  useEffect(() => {
    const summaries: Record<string, { summary: string; nextMonthPlan: string }> = {};

    tasks.forEach((task) => {
      const saved = task.monthlySummaries?.[selectedMonthId];
      if (saved) {
        summaries[task.id] = {
          summary: saved.summary,
          nextMonthPlan: saved.nextMonthPlan,
        };
      } else {
        const weeklyTexts: string[] = [];
        let lastWeekPlan = '';

        weeksInMonth.forEach((week) => {
          const rec = task.weeklyRecords[week.id];
          if (rec?.thisWeekWork && rec.thisWeekWork.trim()) {
            weeklyTexts.push(`[${week.shortLabel}]\n${rec.thisWeekWork.trim()}`);
          }
          if (rec?.nextWeekPlan && rec.nextWeekPlan.trim()) {
            lastWeekPlan = rec.nextWeekPlan.trim();
          }
        });

        summaries[task.id] = {
          summary: weeklyTexts.join('\n\n') || '- 해당 월 주간 실적 데이터 준비 중',
          nextMonthPlan: lastWeekPlan || '- 차월 주요 마일스톤 정상 추진 계획',
        };
      }
    });

    setLocalSummaries(summaries);
    setLocalOverview(settings.monthlyOverviews?.[selectedMonthId] || '');
  }, [selectedMonthId, tasks]);

  const aggregatedTasks = tasks
    .filter((task) => {
      const hasAnyWeekRecord = weeksInMonth.some((w) => !!task.weeklyRecords[w.id]);
      if (hasAnyWeekRecord) return true;

      const monthStart = `${selectedMonthId}-01`;
      const monthEnd = `${selectedMonthId}-31`;
      return task.startDate <= monthEnd && task.endDate >= monthStart;
    })
    .map((task) => {
      let startProgress = task.progress;
      let endProgress = task.progress;
      const recordsInMonth: Array<{ week: WeekInfo; work: string; plan: string; issues: string; progress: number }> = [];

      weeksInMonth.forEach((week) => {
        const rec = task.weeklyRecords[week.id];
        if (rec) {
          recordsInMonth.push({
            week,
            work: rec.thisWeekWork,
            plan: rec.nextWeekPlan,
            issues: rec.issues,
            progress: rec.progress,
          });
        }
      });

      if (recordsInMonth.length > 0) {
        startProgress = recordsInMonth[0].progress;
        endProgress = recordsInMonth[recordsInMonth.length - 1].progress;
      }

      const summaryData = localSummaries[task.id] || {
        summary: '',
        nextMonthPlan: '',
      };

      return {
        task,
        startProgress,
        endProgress,
        progressDiff: endProgress - startProgress,
        recordsInMonth,
        monthlySummary: summaryData.summary,
        nextMonthPlan: summaryData.nextMonthPlan,
      };
    });

  const totalCount = aggregatedTasks.length;
  const completedCount = aggregatedTasks.filter((t) => t.task.status === 'completed').length;
  const delayedCount = aggregatedTasks.filter((t) => t.task.status === 'delayed').length;
  const normalCount = aggregatedTasks.filter((t) => t.task.status === 'normal').length;
  const avgProgress = totalCount
    ? Math.round(aggregatedTasks.reduce((sum, t) => sum + t.endProgress, 0) / totalCount)
    : 0;

  const handleSummaryChange = (taskId: string, newSummary: string) => {
    setLocalSummaries((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        summary: newSummary,
      },
    }));
    onUpdateMonthlySummary(
      taskId,
      selectedMonthId,
      newSummary,
      localSummaries[taskId]?.nextMonthPlan || ''
    );
  };

  const handleNextMonthPlanChange = (taskId: string, newPlan: string) => {
    setLocalSummaries((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        nextMonthPlan: newPlan,
      },
    }));
    onUpdateMonthlySummary(
      taskId,
      selectedMonthId,
      localSummaries[taskId]?.summary || '',
      newPlan
    );
  };

  const handleOverviewChange = (newOverview: string) => {
    setLocalOverview(newOverview);
    onUpdateMonthlyOverview(selectedMonthId, newOverview);
  };

  const handleGenerateAiSummary = async (taskId: string) => {
    const item = aggregatedTasks.find((t) => t.task.id === taskId);
    if (!item) return;

    setLoadingAiMap((prev) => ({ ...prev, [taskId]: true }));

    try {
      const weeklyEntriesPayload = item.recordsInMonth.map((r) => ({
        weekLabel: r.week.label,
        work: r.work,
        plan: r.plan,
        issues: r.issues,
        progress: r.progress,
      }));

      const res = await fetch('/api/ai/summarize-monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: item.task.title,
          category: item.task.category,
          weeklyEntries: weeklyEntriesPayload,
          monthLabel,
        }),
      });

      if (!res.ok) {
        throw new Error('AI 요약 요청에 실패했습니다.');
      }

      const data = await res.json();
      if (data.summary) {
        handleSummaryChange(taskId, data.summary);
      }
    } catch (e: any) {
      console.error('AI summary error:', e);
      const fallback = item.recordsInMonth
        .filter((r) => r.work)
        .map((r) => r.work.split('\n').filter((l) => l.trim()))
        .flat()
        .map((l) => (l.startsWith('-') ? l : `- ${l}`))
        .slice(0, 4)
        .join('\n');

      handleSummaryChange(
        taskId,
        fallback || `- ${monthLabel} 주요 개발 및 운영 업무 정상 완수\n- 단계별 세부 기능 검증 완료`
      );
    } finally {
      setLoadingAiMap((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleGenerateAiOverview = async () => {
    setLoadingOverviewAi(true);
    try {
      const tasksSummary = aggregatedTasks
        .map((t) => `• ${t.task.title} (${t.task.category} / ${t.task.status}): ${t.monthlySummary.slice(0, 120)}...`)
        .join('\n');

      const res = await fetch('/api/ai/summarize-overview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthLabel,
          stats: {
            total: totalCount,
            completed: completedCount,
            delayed: delayedCount,
            normal: normalCount,
            avgProgress,
          },
          tasksSummary,
        }),
      });

      if (!res.ok) throw new Error('AI 총평 생성 실패');
      const data = await res.json();
      if (data.overview) {
        handleOverviewChange(data.overview);
      }
    } catch (e) {
      console.error(e);
      handleOverviewChange(
        `- ${monthLabel} 전체 ${totalCount}개 과제 중 완료 ${completedCount}건, 정상 ${normalCount}건으로 전반적 일정 양호\n- 지연 과제(${delayedCount}건)는 차월 집중 지원을 통해 목표 납기 내 만회 추진\n- 주요 마일스톤 달성률 ${avgProgress}% 기록 및 부서 협업 체계 확립`
      );
    } finally {
      setLoadingOverviewAi(false);
    }
  };

  const exportPayload = aggregatedTasks.map((t) => ({
    category: t.task.category,
    title: t.task.title,
    assignee: t.task.assignee,
    startProgress: t.startProgress,
    endProgress: t.endProgress,
    status: t.task.status,
    monthlySummary: t.monthlySummary,
    nextMonthPlan: t.nextMonthPlan,
  }));

  const handleCopyClipboard = async () => {
    const success = await copyMonthlyTableToClipboard(
      `${settings.teamName || '팀'} 월간 업무 보고서`,
      monthLabel,
      localOverview,
      exportPayload
    );
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const handleExportExcel = () => {
    exportMonthlyToExcel(
      `${settings.teamName || '팀'} 월간 업무 보고서`,
      monthLabel,
      localOverview,
      exportPayload,
      `${settings.teamName || '업무보고'}_월간보고서_${selectedMonthId}`
    );
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportMonthlyToWord(
        `${settings.teamName || '팀'} 월간 업무 보고서`,
        monthLabel,
        localOverview,
        exportPayload,
        `${settings.teamName || '업무보고'}_월간보고서_${selectedMonthId}`
      );
    } catch (e) {
      console.error(e);
      setErrorMessage('워드 내보내기 처리 중 오류가 발생했습니다.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsExportingWord(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Banner & Month Selector */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-600" />
              주간 데이터 자동 취합 & AI 월간 요약
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            {monthLabel} 월간 업무 보고서
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            해당 월에 입력된 주간 실적들을 과제별로 자동 집계하고, Gemini AI로 3~5줄 개조식 요약을 생성합니다.
          </p>
        </div>

        {/* Month Selector Dropdown & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#FAF7F2] border border-[#DDD2C6] px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-stone-500" />
            <select
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              className="bg-transparent text-sm font-bold text-stone-800 focus:outline-none cursor-pointer"
            >
              {availableMonths.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Export buttons */}
          <button
            onClick={handleCopyClipboard}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              copySuccess ? 'bg-emerald-600 text-white' : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
          >
            {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copySuccess ? '표 복사완료!' : '클립보드 복사'}
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            엑셀(.xlsx)
          </button>

          <button
            onClick={handleExportWord}
            disabled={isExportingWord}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-sky-50 hover:text-sky-800 transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600" />
            {isExportingWord ? '생성 중...' : '워드(.docx)'}
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-[#FAF6F1] transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            인쇄
          </button>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copySuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2 print:hidden animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>서식 복사 성공!</strong> 이메일, 사내 결재문서, 메신저, 구글 닥스에 [Ctrl + V]로 붙여넣으면 표 테두리와 서식이 유지됩니다.
          </span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 flex items-center gap-2 print:hidden animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Pastel Monthly Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E8DFD5] shadow-xs">
          <span className="text-xs font-semibold text-stone-500">당월 총 과제 수</span>
          <div className="text-2xl font-black text-stone-900 mt-1">{totalCount}건</div>
          <span className="text-[11px] text-stone-400">포함 주차: {weeksInMonth.length}개 주</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD5] shadow-xs">
          <span className="text-xs font-semibold text-stone-500">완료 / 정상 진행</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {completedCount + normalCount}건
          </div>
          <span className="text-[11px] text-emerald-700 font-semibold">
            (완료 {completedCount}건, 정상 {normalCount}건)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD5] shadow-xs">
          <span className="text-xs font-semibold text-stone-500">일정 지연 과제</span>
          <div className={`text-2xl font-black mt-1 ${delayedCount > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
            {delayedCount}건
          </div>
          <span className="text-[11px] text-stone-400">
            {delayedCount > 0 ? '차월 만회 계획 수립 필요' : '지연 과제 없음'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E8DFD5] shadow-xs">
          <span className="text-xs font-semibold text-stone-500">월말 평균 진척률</span>
          <div className="text-2xl font-black text-stone-800 mt-1">{avgProgress}%</div>
          <span className="text-[11px] text-rose-600 font-semibold">전체 평균 달성</span>
        </div>
      </div>

      {/* Executive Overview Section with AI Button */}
      <div className="bg-[#2D2723] rounded-2xl text-stone-100 p-6 shadow-md border border-[#423933]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-300">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                경영진 월간 총평 (Executive Summary)
                <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Gemini Flash AI
                </span>
              </h3>
              <p className="text-xs text-stone-300">
                과제별 종합 실적을 바탕으로 임원 보고용 3~4줄 핵심 총평을 작성합니다.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiOverview}
            disabled={loadingOverviewAi}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-center disabled:opacity-70"
          >
            {loadingOverviewAi ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                AI 분석 및 요약 중...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                AI 총평 자동 생성
              </>
            )}
          </button>
        </div>

        <textarea
          rows={4}
          value={localOverview}
          onChange={(e) => handleOverviewChange(e.target.value)}
          placeholder="- AI 총평 자동 생성을 누르거나 직접 총평을 작성하세요.&#10;- 예: 당월 핵심 시스템 연동 마일스톤 100% 달성 및 파일럿 검증 착수"
          className="w-full p-3.5 bg-white/10 border border-white/20 rounded-xl text-xs text-stone-100 placeholder-stone-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-rose-400 leading-relaxed font-mono"
        />
      </div>

      {/* Task Monthly Aggregation Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
            과제별 월간 실적 집계 및 AI 요약 ({aggregatedTasks.length}건)
          </h2>
          <span className="text-xs text-stone-500">
            각 과제의 'AI 요약' 버튼을 누르면 주간 기록을 3~5줄 개조식으로 정제합니다.
          </span>
        </div>

        {aggregatedTasks.map((item) => {
          const isLoadingAi = loadingAiMap[item.task.id];
          const hasWeeklyRecords = item.recordsInMonth.length > 0;

          return (
            <div
              key={item.task.id}
              className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs overflow-hidden transition-all hover:border-[#D5C6B6]"
            >
              {/* Task Header */}
              <div className="p-5 bg-[#FAF6F1] border-b border-[#E8DFD5] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-stone-800 bg-[#EFE7DE] px-2 py-0.5 rounded border border-[#E0D3C4]">
                      {item.task.category}
                    </span>
                    <h3 className="text-base font-bold text-stone-900">
                      {item.task.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                    <span>담당: <strong>{item.task.assignee}</strong></span>
                    <span>•</span>
                    <span>기간: {item.task.startDate} ~ {item.task.endDate}</span>
                    <span>•</span>
                    <span>당월 주간 기록: {item.recordsInMonth.length}개 주차 취합</span>
                  </div>
                </div>

                {/* Progress Change Pill & AI Button */}
                <div className="flex items-center gap-3">
                  <div className="bg-white px-3 py-1.5 rounded-xl border border-[#DDD2C6] text-xs">
                    <span className="text-stone-500 mr-2">진척률 변화:</span>
                    <span className="font-semibold text-stone-600">{item.startProgress}%</span>
                    <span className="text-stone-400 mx-1.5">→</span>
                    <strong className="text-rose-600 font-extrabold">{item.endProgress}%</strong>
                    {item.progressDiff > 0 && (
                      <span className="ml-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        +{item.progressDiff}%p
                      </span>
                    )}
                  </div>

                  {/* AI Summarize Button for This Task */}
                  <button
                    type="button"
                    onClick={() => handleGenerateAiSummary(item.task.id)}
                    disabled={isLoadingAi || !hasWeeklyRecords}
                    className="px-3.5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                    title="주간 실적들을 바탕으로 Gemini AI 3~5줄 개조식 요약 자동 생성"
                  >
                    {isLoadingAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        AI 요약 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                        AI 3줄 요약
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monthly Content Grid */}
              <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Monthly Summary */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      월간 실적 요약 (직접 수정 가능)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      개조식 문장 권장 (- 문맥)
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={item.monthlySummary}
                    onChange={(e) => handleSummaryChange(item.task.id, e.target.value)}
                    placeholder="- 주간 실적이 자동 취합되어 표시되며, AI 요약 버튼으로 명료하게 압축할 수 있습니다."
                    className="w-full p-3 text-xs leading-relaxed bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-mono text-stone-900"
                  />
                </div>

                {/* Right: Next Month Plan */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-700" />
                      익월(다음 달) 추진 계획 (직접 수정 가능)
                    </label>
                    <span className="text-[10px] text-stone-400">
                      마지막 주 계획에서 자동 채움
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={item.nextMonthPlan}
                    onChange={(e) => handleNextMonthPlanChange(item.task.id, e.target.value)}
                    placeholder="- 다음 달 핵심 달성 목표 및 단계별 액션 플랜을 입력하세요."
                    className="w-full p-3 text-xs leading-relaxed bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-mono text-stone-900"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
