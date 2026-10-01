import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ListPlus,
  Trash2,
  Check,
  Search,
  Filter,
  Eye,
  EyeOff,
  User,
  Tag
} from 'lucide-react';
import { Task, WeekInfo, TaskStatus, WeeklyRecord } from '../types/report';
import { shiftWeek, getCurrentWeekInfo, formatDateRange } from '../utils/dateUtils';

interface WeeklyInputViewProps {
  tasks: Task[];
  currentWeek: WeekInfo;
  selectedWeek: WeekInfo;
  onSelectWeek: (week: WeekInfo) => void;
  onUpdateWeeklyRecord: (taskId: string, record: WeeklyRecord, updatedProgress?: number, updatedStatus?: TaskStatus) => void;
  onOpenNewTaskModal: () => void;
  onDeleteTask: (taskId: string, title: string) => void;
  categories: string[];
  assignees: string[];
}

export const WeeklyInputView: React.FC<WeeklyInputViewProps> = ({
  tasks,
  currentWeek,
  selectedWeek,
  onSelectWeek,
  onUpdateWeeklyRecord,
  onOpenNewTaskModal,
  onDeleteTask,
  categories,
  assignees,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [autoFilledNotices, setAutoFilledNotices] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const prevWeek = shiftWeek(selectedWeek, -1);
  const nextWeek = shiftWeek(selectedWeek, 1);

  // Auto-fill logic: if current week has no thisWeekWork, copy from previous week's nextWeekPlan
  useEffect(() => {
    const newlyFilledNotices: Record<string, boolean> = {};

    tasks.forEach((task) => {
      const currentRec = task.weeklyRecords[selectedWeek.id];
      const prevRec = task.weeklyRecords[prevWeek.id];

      if ((!currentRec || !currentRec.thisWeekWork) && prevRec?.nextWeekPlan && prevRec.nextWeekPlan.trim()) {
        const autoFilledRecord: WeeklyRecord = {
          thisWeekWork: prevRec.nextWeekPlan,
          nextWeekPlan: currentRec?.nextWeekPlan || '',
          issues: currentRec?.issues || '',
          progress: currentRec?.progress !== undefined ? currentRec.progress : task.progress,
          status: currentRec?.status || task.status,
          updatedAt: new Date().toISOString(),
        };
        onUpdateWeeklyRecord(task.id, autoFilledRecord);
        newlyFilledNotices[task.id] = true;
      }
    });

    if (Object.keys(newlyFilledNotices).length > 0) {
      setAutoFilledNotices((prev) => ({ ...prev, ...newlyFilledNotices }));
    }
  }, [selectedWeek.id]);

  // Filter tasks for this week
  const visibleTasks = tasks.filter((task) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(query);
      const matchAssignee = task.assignee.toLowerCase().includes(query);
      if (!matchTitle && !matchAssignee) return false;
    }

    if (selectedCategory !== 'all' && task.category !== selectedCategory) {
      return false;
    }

    if (selectedAssignee !== 'all' && task.assignee !== selectedAssignee) {
      return false;
    }

    if (task.status === 'completed' && !showCompleted) {
      const hasThisWeekRecord = !!task.weeklyRecords[selectedWeek.id];
      if (task.endDate < selectedWeek.startDate && !hasThisWeekRecord) {
        return false;
      }
    }

    return true;
  });

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  const addBulletPoint = (text: string): string => {
    if (!text) return '- ';
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    if (lastLine.trim() === '') {
      return `${text}- `;
    }
    return `${text}\n- `;
  };

  const formatBullets = (text: string): string => {
    if (!text.trim()) return '';
    return text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
          return `- ${trimmed.replace(/^[-•*]\s*/, '')}`;
        }
        return `- ${trimmed}`;
      })
      .filter(Boolean)
      .join('\n');
  };

  const handlePullPrevPlan = (task: Task) => {
    const prevRec = task.weeklyRecords[prevWeek.id];
    if (!prevRec?.nextWeekPlan) {
      setToastMessage('지난주 차주 계획 데이터가 없습니다.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const currentRec = task.weeklyRecords[selectedWeek.id] || {
      thisWeekWork: '',
      nextWeekPlan: '',
      issues: '',
      progress: task.progress,
      status: task.status,
    };

    onUpdateWeeklyRecord(task.id, {
      ...currentRec,
      thisWeekWork: prevRec.nextWeekPlan,
      updatedAt: new Date().toISOString(),
    });

    setAutoFilledNotices((prev) => ({ ...prev, [task.id]: true }));
    setToastMessage(`"${task.title}" 과제에 지난주 계획을 반영했습니다.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* Top Header & Week Navigator */}
      <div className="bg-white rounded-2xl border border-[#E8DFD5] shadow-xs p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
              주간 업무 실적 및 계획 입력
            </span>
            <span className="text-xs text-stone-500 font-medium">| 월~금 기준</span>
          </div>
          <h1 className="text-xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            {selectedWeek.label}
            <span className="text-sm font-normal text-stone-500">
              ({formatDateRange(selectedWeek.startDate, selectedWeek.endDate)})
            </span>
          </h1>
        </div>

        {/* Week navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectWeek(prevWeek)}
            className="p-2 text-stone-700 hover:text-stone-900 bg-white hover:bg-[#FAF6F1] rounded-lg border border-[#DDD2C6] transition-colors flex items-center gap-1 text-xs font-semibold"
            title="이전 주로 이동"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">이전 주</span>
          </button>

          <button
            onClick={() => onSelectWeek(getCurrentWeekInfo())}
            className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedWeek.id === currentWeek.id
                ? 'bg-orange-600 text-white border-orange-600 shadow-xs hover:bg-orange-700'
                : 'bg-white text-stone-700 border-[#DDD2C6] hover:bg-[#FAF6F1]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            이번 주로 이동
          </button>

          <button
            onClick={() => onSelectWeek(nextWeek)}
            className="p-2 text-stone-700 hover:text-stone-900 bg-white hover:bg-[#FAF6F1] rounded-lg border border-[#DDD2C6] transition-colors flex items-center gap-1 text-xs font-semibold"
            title="다음 주로 이동"
          >
            <span className="hidden sm:inline">다음 주</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-6 w-px bg-[#E2D8CC] mx-1" />

          <button
            onClick={onOpenNewTaskModal}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            새 과제 추가
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-orange-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Auto-fill notification banner (Pastel Beige & Amber) */}
      <div className="bg-[#FFF9F2] border border-[#F0DDC8] rounded-xl p-3.5 flex items-center justify-between text-xs text-[#8C5228]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>스마트 자동 승계:</strong> 지난주에 입력한 <strong>'차주 계획'</strong>이 이번 주 <strong>'금주 실적'</strong>의 초안으로 자동 채워집니다. 필요 시 내용을 수정하세요.
          </span>
        </div>
        <span className="text-[11px] text-[#A66D44] hidden md:inline font-medium">
          수정 시 실시간 자동 저장
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-[#E8DFD5] p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="과제명, 담당자 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="all">모든 카테고리</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E2D8CC] rounded-lg text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-400"
          >
            <option value="all">모든 담당자</option>
            {assignees.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Completed Tasks */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              showCompleted
                ? 'bg-stone-800 text-white border-stone-800'
                : 'bg-white text-stone-600 border-[#DDD2C6] hover:bg-[#FAF6F1]'
            }`}
          >
            {showCompleted ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            완료 과제 표시 ({completedCount}건)
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      {visibleTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8DFD5] p-12 text-center shadow-xs">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">
            해당 조건에 맞는 업무 과제가 없습니다.
          </h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
            {showCompleted
              ? '새로운 과제를 추가하여 주간 업무 실적을 기록해보세요.'
              : '진행 중인 과제가 없거나 모두 완료되었습니다. 새 과제를 등록하거나 상단에서 완료 과제 표시를 켜보세요.'}
          </p>
          <button
            onClick={onOpenNewTaskModal}
            className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            새 과제 추가하기
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleTasks.map((task) => {
            const currentRec = task.weeklyRecords[selectedWeek.id] || {
              thisWeekWork: '',
              nextWeekPlan: '',
              issues: '',
              progress: task.progress,
              status: task.status,
            };

            const isAutoFilled = autoFilledNotices[task.id];
            const isCompleted = currentRec.status === 'completed';
            const isDelayed = currentRec.status === 'delayed';

            const handleRecordChange = (field: keyof WeeklyRecord, value: any) => {
              const updated: WeeklyRecord = {
                ...currentRec,
                [field]: value,
                updatedAt: new Date().toISOString(),
              };

              let updatedProgress = task.progress;
              let updatedStatus = task.status;

              if (field === 'progress') {
                updatedProgress = Number(value);
              }
              if (field === 'status') {
                updatedStatus = value as TaskStatus;
              }

              onUpdateWeeklyRecord(task.id, updated, updatedProgress, updatedStatus);
            };

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                  isDelayed
                    ? 'border-rose-300 ring-1 ring-rose-200'
                    : isCompleted
                    ? 'border-emerald-300 bg-emerald-50/15'
                    : 'border-[#E8DFD5] hover:border-[#D5C6B6]'
                }`}
              >
                {/* Card Header */}
                <div className="p-5 border-b border-[#E8DFD5] bg-[#FAF6F1] flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-stone-800 bg-[#EFE7DE] px-2.5 py-1 rounded-md border border-[#E0D3C4] shadow-2xs shrink-0 mt-0.5">
                      {task.category}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-stone-900">
                          {task.title}
                        </h3>
                        {isCompleted && (
                          <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> 완료 과제
                          </span>
                        )}
                        {isDelayed && (
                          <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> 일정 지연
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500 mt-1">
                        <span className="flex items-center gap-1 font-medium text-stone-700">
                          <User className="w-3.5 h-3.5 text-stone-400" />
                          담당: {task.assignee}
                        </span>
                        <span>•</span>
                        <span>기간: {task.startDate} ~ {task.endDate}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Progress Quick Controls */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    {/* Status dropdown */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-stone-500 font-medium">상태:</span>
                      <select
                        value={currentRec.status}
                        onChange={(e) => handleRecordChange('status', e.target.value as TaskStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border focus:ring-2 focus:ring-rose-400 ${
                          currentRec.status === 'delayed'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : currentRec.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : currentRec.status === 'hold'
                            ? 'bg-stone-100 text-stone-700 border-stone-300'
                            : 'bg-sky-50 text-sky-800 border-sky-200'
                        }`}
                      >
                        <option value="normal">정상</option>
                        <option value="delayed">지연</option>
                        <option value="completed">완료</option>
                        <option value="hold">보류</option>
                      </select>
                    </div>

                    {/* Progress Slider */}
                    <div className="flex items-center gap-2 bg-[#FAF7F2] px-3 py-1 rounded-lg border border-[#E2D8CC]">
                      <span className="text-xs text-stone-500 font-medium">진척률:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={currentRec.progress}
                        onChange={(e) => handleRecordChange('progress', Number(e.target.value))}
                        className="w-20 accent-orange-600 cursor-pointer"
                      />
                      <span className="text-xs font-black text-orange-600 w-9 text-right">
                        {currentRec.progress}%
                      </span>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => onDeleteTask(task.id, task.title)}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                      title="과제 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Card Body: 3 Editor Columns */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Column 1: 금주 실적 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-orange-600" />
                          금주 실적 (개조식)
                        </label>
                        {isAutoFilled && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 font-semibold px-1.5 py-0.2 rounded">
                            지난주 계획 승계됨
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePullPrevPlan(task)}
                          className="text-[11px] text-stone-500 hover:text-rose-600 flex items-center gap-0.5 hover:underline"
                          title="지난주 계획 다시 불러오기"
                        >
                          <RotateCcw className="w-3 h-3" />
                          다시 불러오기
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecordChange('thisWeekWork', addBulletPoint(currentRec.thisWeekWork))}
                          className="text-[11px] bg-[#EDE5DD] hover:bg-[#E2D7CC] px-1.5 py-0.5 rounded text-stone-700 flex items-center gap-0.5"
                          title="불릿 추가"
                        >
                          <ListPlus className="w-3 h-3" />
                          - 추가
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={5}
                      value={currentRec.thisWeekWork}
                      onChange={(e) => handleRecordChange('thisWeekWork', e.target.value)}
                      onBlur={(e) => handleRecordChange('thisWeekWork', formatBullets(e.target.value))}
                      placeholder="- 이번 주 완료한 핵심 업무를 개조식으로 입력하세요.&#10;- 예: 1차 인터페이스 규격 설계 완료"
                      className="w-full p-3 text-xs leading-relaxed bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-mono text-stone-900"
                    />
                  </div>

                  {/* Column 2: 차주 계획 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-amber-700" />
                        차주 계획 (개조식)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleRecordChange('nextWeekPlan', addBulletPoint(currentRec.nextWeekPlan))}
                        className="text-[11px] bg-[#EDE5DD] hover:bg-[#E2D7CC] px-1.5 py-0.5 rounded text-stone-700 flex items-center gap-0.5"
                        title="불릿 추가"
                      >
                        <ListPlus className="w-3 h-3" />
                        - 추가
                      </button>
                    </div>
                    <textarea
                      rows={5}
                      value={currentRec.nextWeekPlan}
                      onChange={(e) => handleRecordChange('nextWeekPlan', e.target.value)}
                      onBlur={(e) => handleRecordChange('nextWeekPlan', formatBullets(e.target.value))}
                      placeholder="- 다음 주 추진할 목표 및 업무를 입력하세요.&#10;- 다음 주 실적의 초안으로 자동 전달됩니다."
                      className="w-full p-3 text-xs leading-relaxed bg-[#FAF7F2] border border-[#E2D8CC] rounded-xl focus:bg-white focus:ring-2 focus:ring-rose-400 focus:outline-none transition-all font-mono text-stone-900"
                    />
                  </div>

                  {/* Column 3: 이슈 및 요청사항 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-stone-800 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        이슈사항 및 협조 요청
                      </label>
                      <span className="text-[10px] text-stone-400">없으면 비워둠</span>
                    </div>
                    <textarea
                      rows={5}
                      value={currentRec.issues}
                      onChange={(e) => handleRecordChange('issues', e.target.value)}
                      placeholder="타 부서 협조 요청사항, 지연 사유 및 만회 계획, 승인 지연 이슈 등을 적어주세요."
                      className={`w-full p-3 text-xs leading-relaxed border rounded-xl focus:bg-white focus:ring-2 focus:outline-none transition-all ${
                        currentRec.issues && currentRec.issues.trim()
                          ? 'bg-amber-50/50 border-amber-300 focus:ring-amber-500'
                          : 'bg-[#FAF7F2] border-[#E2D8CC] focus:ring-rose-400'
                      }`}
                    />
                  </div>
                </div>

                {/* Completion Notice Footer */}
                {isCompleted && (
                  <div className="bg-emerald-50 px-5 py-2.5 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Check className="w-4 h-4 text-emerald-600" />
                      이 과제는 완료 처리되었습니다. 다음 주차부터는 기본 목록에서 자동으로 제외됩니다.
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      상태를 변경하면 다시 진행 중으로 복구됩니다.
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
