import React, { useState } from 'react';
import {
  Settings,
  Users,
  Tag,
  Columns,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  Building,
  FileText
} from 'lucide-react';
import { AppSettings, VisibleColumns } from '../types/report';
import { exportAppDataJson, importAppDataJson } from '../utils/storage';
import { ConfirmModal } from './ConfirmModal';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSampleData,
  onClearAllData,
}) => {
  const [teamName, setTeamName] = useState(settings.teamName || '');
  const [reportTitleFormat, setReportTitleFormat] = useState(settings.reportTitleFormat || '{teamName} 주간 업무 보고');

  const [categories, setCategories] = useState<string[]>(settings.categories || []);
  const [newCategory, setNewCategory] = useState('');

  const [assignees, setAssignees] = useState<string[]>(settings.assignees || []);
  const [newAssignee, setNewAssignee] = useState('');

  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(settings.visibleColumns);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveTeamSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      ...settings,
      teamName: teamName.trim() || '업무팀',
      reportTitleFormat: reportTitleFormat.trim(),
      categories,
      assignees,
      visibleColumns,
    };
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      setErrorMessage('이미 존재하는 카테고리입니다.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const updated = [...categories, newCategory.trim()];
    setCategories(updated);
    setNewCategory('');
    onUpdateSettings({ ...settings, categories: updated });
  };

  const handleRemoveCategory = (cat: string) => {
    if (categories.length <= 1) {
      setErrorMessage('최소 1개 이상의 카테고리가 필요합니다.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    onUpdateSettings({ ...settings, categories: updated });
  };

  const handleAddAssignee = () => {
    if (!newAssignee.trim()) return;
    if (assignees.includes(newAssignee.trim())) {
      setErrorMessage('이미 존재하는 담당자입니다.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const updated = [...assignees, newAssignee.trim()];
    setAssignees(updated);
    setNewAssignee('');
    onUpdateSettings({ ...settings, assignees: updated });
  };

  const handleRemoveAssignee = (name: string) => {
    if (assignees.length <= 1) {
      setErrorMessage('최소 1명 이상의 담당자가 필요합니다.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }
    const updated = assignees.filter((a) => a !== name);
    setAssignees(updated);
    onUpdateSettings({ ...settings, assignees: updated });
  };

  const handleToggleColumn = (col: keyof VisibleColumns) => {
    const updated = {
      ...visibleColumns,
      [col]: !visibleColumns[col],
    };
    setVisibleColumns(updated);
    onUpdateSettings({ ...settings, visibleColumns: updated });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importAppDataJson(file);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(`데이터 복원 실패: ${err.message}`);
      setTimeout(() => setErrorMessage(null), 4000);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
              시스템 환경 설정
            </span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">
            환경 설정 및 데이터 백업 / 복원
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            팀 명칭, 카테고리, 담당자, 보고서 표 컬럼 표시 여부를 설정하고 데이터를 안전하게 백업합니다.
          </p>
        </div>

        {savedSuccess && (
          <div className="px-3.5 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            설정이 저장되었습니다!
          </div>
        )}

        {errorMessage && (
          <div className="px-3.5 py-2 bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold rounded-xl flex items-center gap-1.5 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            {errorMessage}
          </div>
        )}
      </div>

      {/* 1. Team & Report Title */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#E8DFD5]">
          <Building className="w-5 h-5 text-rose-600" />
          <h2 className="text-base font-bold text-stone-900">
            팀 정보 및 보고서 제목 양식
          </h2>
        </div>

        <form onSubmit={handleSaveTeamSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                소속 팀명
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: 디지털혁신팀, 서비스개발팀"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                주간보고서 제목 포맷
              </label>
              <input
                type="text"
                value={reportTitleFormat}
                onChange={(e) => setReportTitleFormat(e.target.value)}
                placeholder="예: {teamName} 주간 업무 보고"
                className="w-full px-3.5 py-2 bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <span className="text-[11px] text-stone-400 mt-1 block">
                * {`{teamName}`} 문구는 자동으로 팀명으로 치환됩니다.
              </span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
            >
              기본 정보 저장
            </button>
          </div>
        </form>
      </div>

      {/* 2. Categories & Assignees Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFD5]">
            <Tag className="w-5 h-5 text-amber-700" />
            <h2 className="text-base font-bold text-stone-900">
              업무 카테고리 관리 ({categories.length}개)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="새 카테고리 (예: AI 전환)"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
              className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-stone-800 focus:bg-white focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#F2EAE1] text-stone-800 border border-[#E3D6C8]"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="text-stone-400 hover:text-rose-600 transition-colors"
                  title="카테고리 삭제"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Assignees */}
        <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFD5]">
            <Users className="w-5 h-5 text-stone-700" />
            <h2 className="text-base font-bold text-stone-900">
              담당자 목록 관리 ({assignees.length}명)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="담당자 이름 (예: 홍길동 책임)"
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAssignee())}
              className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-stone-800 focus:bg-white focus:ring-2 focus:ring-rose-400"
            />
            <button
              type="button"
              onClick={handleAddAssignee}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              추가
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {assignees.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-[#EFE9E2] text-stone-800 border border-[#DDD3C7]"
              >
                {a}
                <button
                  type="button"
                  onClick={() => handleRemoveAssignee(a)}
                  className="text-stone-400 hover:text-rose-600 transition-colors"
                  title="담당자 삭제"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Weekly Report Table Columns Visibility */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFD5]">
          <Columns className="w-5 h-5 text-stone-700" />
          <div>
            <h2 className="text-base font-bold text-stone-900">
              주간보고서 표 표시 열 설정
            </h2>
            <p className="text-xs text-stone-500">
              보고서 미리보기, 엑셀/워드 출력 시 포함할 열을 선택합니다. (과제명은 필수)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {[
            { key: 'category' as keyof VisibleColumns, label: '카테고리 구분' },
            { key: 'assignee' as keyof VisibleColumns, label: '담당자' },
            { key: 'period' as keyof VisibleColumns, label: '추진 일정' },
            { key: 'thisWeekWork' as keyof VisibleColumns, label: '금주 실적' },
            { key: 'nextWeekPlan' as keyof VisibleColumns, label: '차주 계획' },
            { key: 'progress' as keyof VisibleColumns, label: '진척률(%)' },
            { key: 'status' as keyof VisibleColumns, label: '상태 (정상/지연/완료)' },
          ].map((item) => (
            <label
              key={item.key}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                visibleColumns[item.key]
                  ? 'bg-[#F7EFE6] border-rose-300 text-stone-900 font-bold'
                  : 'bg-[#FAF7F2] border-[#E8DFD5] text-stone-500'
              }`}
            >
              <span className="text-xs">{item.label}</span>
              <input
                type="checkbox"
                checked={visibleColumns[item.key]}
                onChange={() => handleToggleColumn(item.key)}
                className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* 4. Backup & Restore & Reset Section */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-[#E8DFD5]">
          <Download className="w-5 h-5 text-emerald-700" />
          <div>
            <h2 className="text-base font-bold text-stone-900">
              데이터 백업 및 복원 (JSON)
            </h2>
            <p className="text-xs text-stone-500">
              모든 과제 데이터와 설정은 브라우저에 저장됩니다. 안전한 보관을 위해 JSON 파일로 백업해두세요.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Backup Download */}
          <div className="p-4 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] space-y-2">
            <span className="text-xs font-bold text-stone-900 block">
              1. 전체 데이터 JSON 백업
            </span>
            <p className="text-xs text-stone-500">
              현재 등록된 모든 과제, 주차별 실적, 월간 요약, 설정을 JSON 파일로 다운로드합니다.
            </p>
            <button
              onClick={exportAppDataJson}
              className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              JSON 백업 파일 다운로드
            </button>
          </div>

          {/* Backup Restore */}
          <div className="p-4 rounded-xl border border-[#E8DFD5] bg-[#FAF7F2] space-y-2">
            <span className="text-xs font-bold text-stone-900 block">
              2. 백업 파일로부터 복원
            </span>
            <p className="text-xs text-stone-500">
              이전에 내려받은 JSON 파일을 업로드하여 데이터를 원래대로 복원합니다.
            </p>
            <label className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FAF6F1] text-stone-700 border border-[#DDD2C6] text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-stone-700" />
              JSON 백업 파일 선택...
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone: Reset & Clear */}
        <div className="pt-4 border-t border-[#E8DFD5] space-y-3">
          <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            초기화 관리
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 bg-[#FFF9F2] hover:bg-[#FCEFD9] text-amber-900 border border-amber-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              기본 샘플 데이터로 재설정
            </button>

            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              전체 데이터 완전 초기화
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmModal
        isOpen={showResetConfirm}
        title="샘플 데이터로 재설정하시겠습니까?"
        message="현재 작성된 모든 업무 기록이 초기 예시 과제 4건 및 지난 2주치 샘플 데이터로 교체됩니다. 계속하시겠습니까?"
        confirmText="재설정 실행"
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetSampleData();
        }}
        onCancel={() => setShowResetConfirm(false)}
      />

      <ConfirmModal
        isOpen={showClearConfirm}
        title="전체 데이터를 완전히 초기화하시겠습니까?"
        message="등록된 모든 과제, 주간 실적 및 설정이 삭제되며 빈 상태가 됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmText="완전 삭제 및 초기화"
        isDanger={true}
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearAllData();
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};
