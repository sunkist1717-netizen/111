import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FileSpreadsheet,
  FileDown,
  Printer,
  Calendar,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { Task, WeekInfo, AppSettings, VisibleColumns } from '../types/report';
import { shiftWeek, getCurrentWeekInfo, formatDateRange } from '../utils/dateUtils';
import {
  prepareWeeklyReportRows,
  copyTableToClipboard,
  exportToExcel,
  exportToWord,
} from '../utils/exportUtils';

interface WeeklyReportViewProps {
  tasks: Task[];
  selectedWeek: WeekInfo;
  onSelectWeek: (week: WeekInfo) => void;
  settings: AppSettings;
  onNavigateTab: (tab: any) => void;
}

export const WeeklyReportView: React.FC<WeeklyReportViewProps> = ({
  tasks,
  selectedWeek,
  onSelectWeek,
  settings,
  onNavigateTab,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [isExportingWord, setIsExportingWord] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const prevWeek = shiftWeek(selectedWeek, -1);
  const nextWeek = shiftWeek(selectedWeek, 1);

  const { rows, issuesList } = prepareWeeklyReportRows(tasks, selectedWeek);

  // Group rows by category
  const categoriesPresent = Array.from(new Set(rows.map((r) => r.category)));
  const sortedCategories = [
    ...settings.categories.filter((c) => categoriesPresent.includes(c)),
    ...categoriesPresent.filter((c) => !settings.categories.includes(c)),
  ];

  const reportTitle = settings.reportTitleFormat
    ? settings.reportTitleFormat.replace('{teamName}', settings.teamName || '팀')
    : `${settings.teamName || '팀'} 주간 업무 보고`;

  const periodText = `${selectedWeek.label} (${formatDateRange(selectedWeek.startDate, selectedWeek.endDate)})`;
  const exportFilename = `${settings.teamName || '업무보고'}_주간보고서_${selectedWeek.startDate}`;

  const totalTasks = rows.length;
  const completedTasks = rows.filter((r) => r.status === '완료').length;
  const delayedTasks = rows.filter((r) => r.status === '지연').length;
  const normalTasks = rows.filter((r) => r.status === '정상').length;

  const handleCopyClipboard = async () => {
    const success = await copyTableToClipboard(
      reportTitle,
      periodText,
      rows,
      issuesList,
      settings.visibleColumns
    );
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } else {
      setErrorMessage('클립보드 복사 권한이 거부되었거나 지원되지 않는 환경입니다.');
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  const handleExportExcel = () => {
    exportToExcel(
      reportTitle,
      periodText,
      rows,
      issuesList,
      settings.visibleColumns,
      exportFilename
    );
  };

  const handleExportWord = async () => {
    try {
      setIsExportingWord(true);
      await exportToWord(
        reportTitle,
        periodText,
        rows,
        issuesList,
        settings.visibleColumns,
        exportFilename
      );
    } catch (e) {
      console.error('Word export failed', e);
      setErrorMessage('워드 문서 생성 중 오류가 발생했습니다.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsExportingWord(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Controls & Action Bar */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectWeek(prevWeek)}
            className="p-2 text-stone-700 hover:text-stone-900 bg-white hover:bg-[#FAF6F1] rounded-lg border border-[#DDD2C6] transition-colors"
            title="이전 주로 이동"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="text-center px-2">
            <span className="text-xs font-bold text-orange-800 block">
              보고서 주차 선택
            </span>
            <span className="text-sm font-extrabold text-stone-900">
              {selectedWeek.label}
            </span>
          </div>
          <button
            onClick={() => onSelectWeek(nextWeek)}
            className="p-2 text-stone-700 hover:text-stone-900 bg-white hover:bg-[#FAF6F1] rounded-lg border border-[#DDD2C6] transition-colors"
            title="다음 주로 이동"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onSelectWeek(getCurrentWeekInfo())}
            className="ml-2 px-2.5 py-1.5 rounded-lg border border-[#DDD2C6] text-xs font-semibold text-stone-700 hover:bg-[#FAF6F1]"
          >
            이번 주
          </button>
        </div>

        {/* 4 Export Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Clipboard Copy */}
          <button
            onClick={handleCopyClipboard}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
              copySuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-600 hover:bg-orange-700 text-white'
            }`}
            title="서식이 유지되는 표 형태로 클립보드에 복사"
          >
            {copySuccess ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copySuccess ? '서식 표 복사완료!' : '클립보드 표 복사'}
          </button>

          {/* Excel Download */}
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-all shadow-xs flex items-center gap-1.5"
            title="Excel(.xlsx) 파일 다운로드"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            엑셀(.xlsx)
          </button>

          {/* Word Download */}
          <button
            onClick={handleExportWord}
            disabled={isExportingWord}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300 transition-all shadow-xs flex items-center gap-1.5"
            title="Word(.docx) 파일 다운로드"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-600" />
            {isExportingWord ? '생성 중...' : '워드(.docx)'}
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-stone-700 bg-white border border-[#DDD2C6] hover:bg-[#FAF6F1] transition-all shadow-xs flex items-center gap-1.5"
            title="인쇄 또는 PDF 파일로 저장"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600" />
            인쇄 / PDF
          </button>
        </div>
      </div>

      {/* Copy Notification Toast */}
      {copySuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 flex items-center gap-2 print:hidden animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>
            <strong>서식 복사 성공!</strong> 이메일, 사내 결재문서, 메신저, 구글 닥스에 [Ctrl + V]로 붙여넣으면 표 테두리와 불릿 서식이 그대로 유지됩니다.
          </span>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-3 text-xs text-rose-900 flex items-center gap-2 print:hidden animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Official Report Document Paper Container (Printable Area) */}
      <div className="bg-[#FCFAF7] rounded-2xl border border-[#E5DACF] shadow-sm p-8 md:p-12 print:shadow-none print:border-none print:p-0 text-stone-900">
        {/* Report Official Header */}
        <div className="border-b-2 border-stone-800 pb-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-800">
                Weekly Business Report
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-stone-950 tracking-tight mt-1">
                {reportTitle}
              </h1>
            </div>
            <div className="text-left md:text-right text-xs text-stone-600 font-medium">
              <div>
                <strong>보고 기간:</strong> {formatDateRange(selectedWeek.startDate, selectedWeek.endDate)}
              </div>
              <div className="text-stone-500 mt-0.5">
                기준 주차: {selectedWeek.label}
              </div>
            </div>
          </div>

          {/* Mini KPI summary strip in pastel tones */}
          <div className="mt-4 pt-3 border-t border-[#EAE1D7] flex flex-wrap items-center gap-6 text-xs text-stone-600">
            <div>
              전체 과제: <strong className="text-stone-900">{totalTasks}건</strong>
            </div>
            <div>
              정상 진행: <strong className="text-sky-700">{normalTasks}건</strong>
            </div>
            <div>
              일정 지연: <strong className="text-rose-600">{delayedTasks}건</strong>
            </div>
            <div>
              완료: <strong className="text-emerald-700">{completedTasks}건</strong>
            </div>
          </div>
        </div>

        {/* Categories and Tables */}
        {sortedCategories.length === 0 ? (
          <div className="py-12 text-center text-stone-400 text-sm">
            이번 주에 등록된 과제 실적이 없습니다. [주간 입력] 화면에서 실적을 입력해주세요.
          </div>
        ) : (
          <div className="space-y-8">
            {sortedCategories.map((cat) => {
              const catRows = rows.filter((r) => r.category === cat);
              if (catRows.length === 0) return null;

              return (
                <div key={cat} className="space-y-2.5">
                  {/* Category Title */}
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <h3 className="text-sm font-bold text-stone-900">
                      {cat} ({catRows.length}건)
                    </h3>
                  </div>

                  {/* Clean Formatted Table */}
                  <div className="overflow-x-auto border border-[#D9CFC4] rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-[#F0E8DE] text-stone-800 font-bold border-b border-[#D9CFC4]">
                        <tr>
                          <th className="py-2.5 px-3 border-r border-[#D9CFC4] w-36">과제명</th>
                          {settings.visibleColumns.assignee && (
                            <th className="py-2.5 px-2.5 border-r border-[#D9CFC4] text-center w-20">담당자</th>
                          )}
                          {settings.visibleColumns.period && (
                            <th className="py-2.5 px-2.5 border-r border-[#D9CFC4] text-center w-24">일정</th>
                          )}
                          {settings.visibleColumns.thisWeekWork && (
                            <th className="py-2.5 px-3.5 border-r border-[#D9CFC4]">금주 실적</th>
                          )}
                          {settings.visibleColumns.nextWeekPlan && (
                            <th className="py-2.5 px-3.5 border-r border-[#D9CFC4]">차주 계획</th>
                          )}
                          {settings.visibleColumns.progress && (
                            <th className="py-2.5 px-2 border-r border-[#D9CFC4] text-center w-16">진척률</th>
                          )}
                          {settings.visibleColumns.status && (
                            <th className="py-2.5 px-2 text-center w-16">상태</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DDD3] text-stone-800">
                        {catRows.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`align-top ${idx % 2 === 1 ? 'bg-[#FAF6F1]' : 'bg-white'}`}
                          >
                            <td className="py-3 px-3 font-bold text-stone-900 border-r border-[#E6DDD3]">
                              {row.title}
                            </td>
                            {settings.visibleColumns.assignee && (
                              <td className="py-3 px-2.5 text-center text-stone-700 border-r border-[#E6DDD3] whitespace-nowrap">
                                {row.assignee}
                              </td>
                            )}
                            {settings.visibleColumns.period && (
                              <td className="py-3 px-2 text-center text-stone-500 text-[11px] border-r border-[#E6DDD3] whitespace-nowrap">
                                {row.period}
                              </td>
                            )}
                            {settings.visibleColumns.thisWeekWork && (
                              <td className="py-3 px-3.5 border-r border-[#E6DDD3] text-stone-800 whitespace-pre-line leading-relaxed">
                                {row.thisWeekWork}
                              </td>
                            )}
                            {settings.visibleColumns.nextWeekPlan && (
                              <td className="py-3 px-3.5 border-r border-[#E6DDD3] text-stone-800 whitespace-pre-line leading-relaxed">
                                {row.nextWeekPlan}
                              </td>
                            )}
                            {settings.visibleColumns.progress && (
                              <td className="py-3 px-2 text-center font-bold text-rose-700 border-r border-[#E6DDD3] whitespace-nowrap">
                                {row.progress}%
                              </td>
                            )}
                            {settings.visibleColumns.status && (
                              <td className="py-3 px-2 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-bold border ${
                                    row.status === '지연'
                                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-extrabold'
                                      : row.status === '완료'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-sky-50 text-sky-800 border-sky-200'
                                  }`}
                                >
                                  {row.status}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Section: Issues and Requests */}
        {issuesList.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-[#D9CFC4]">
            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-1.5 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              ■ 주요 이슈 및 부서간 협조 요청사항 ({issuesList.length}건)
            </h3>
            <div className="bg-[#FFF9F2] border border-[#F2DECC] rounded-xl p-4 space-y-2.5">
              {issuesList.map((item, idx) => (
                <div key={idx} className="text-xs text-[#7A3E1D] flex items-start gap-2">
                  <span className="font-bold text-[#8C4620] shrink-0">
                    • [{item.title} / {item.assignee}]
                  </span>
                  <span className="leading-relaxed">{item.issues}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document Footer */}
        <div className="mt-10 pt-4 border-t border-[#EAE1D7] text-[11px] text-stone-500 flex items-center justify-between">
          <span>작성 부서: {settings.teamName || '디지털혁신팀'}</span>
          <span>출력 일시: {new Date().toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      {/* Return to edit button */}
      <div className="flex justify-center print:hidden">
        <button
          onClick={() => onNavigateTab('weekly-input')}
          className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          주간 실적 계속 수정하기
        </button>
      </div>
    </div>
  );
};
