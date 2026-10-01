import React, { useState, useEffect } from 'react';
import { X, Plus, Calendar, User, Tag, CheckCircle2, Clock } from 'lucide-react';
import { Task, TaskStatus } from '../types/report';
import { formatDate } from '../utils/dateUtils';

interface TaskModalProps {
  isOpen: boolean;
  task?: Task | null;
  categories: string[];
  assignees: string[];
  currentWeekId?: string;
  onSave: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'weeklyRecords' | 'monthlySummaries'>, initialRecord?: { thisWeekWork: string; nextWeekPlan: string }) => void;
  onClose: () => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  task,
  categories,
  assignees,
  currentWeekId,
  onSave,
  onClose,
}) => {
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [assignee, setAssignee] = useState('');
  const [customAssignee, setCustomAssignee] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('normal');
  const [progress, setProgress] = useState(0);

  const [thisWeekWork, setThisWeekWork] = useState('');
  const [nextWeekPlan, setNextWeekPlan] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
      setCustomCategory('');
      setAssignee(task.assignee);
      setCustomAssignee('');
      setStartDate(task.startDate);
      setEndDate(task.endDate);
      setStatus(task.status);
      setProgress(task.progress);
    } else {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      setTitle('');
      setCategory(categories[0] || '시스템 개선');
      setCustomCategory('');
      setAssignee(assignees[0] || '담당자');
      setCustomAssignee('');
      setStartDate(formatDate(today));
      setEndDate(formatDate(nextMonth));
      setStatus('normal');
      setProgress(0);
      setThisWeekWork('');
      setNextWeekPlan('');
    }
  }, [task, isOpen, categories, assignees]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === '__custom__' ? customCategory.trim() || '일반' : category;
    const finalAssignee = assignee === '__custom__' ? customAssignee.trim() || '담당자' : assignee;

    onSave(
      {
        title: title.trim(),
        category: finalCategory,
        assignee: finalAssignee,
        startDate: startDate || formatDate(new Date()),
        endDate: endDate || formatDate(new Date()),
        status,
        progress: Number(progress) || 0,
      },
      !isEditing && currentWeekId
        ? {
            thisWeekWork: thisWeekWork.trim(),
            nextWeekPlan: nextWeekPlan.trim(),
          }
        : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-[#E8DFD5] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 bg-[#2A2522] text-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-300">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {isEditing ? '과제 정보 수정' : '신규 업무 과제 등록'}
              </h2>
              <p className="text-xs text-stone-400">
                {isEditing ? '과제 기본 메타데이터를 변경합니다.' : '주간·월간 보고서에 집계될 새로운 업무 과제를 등록합니다.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#FDFBF9]">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              과제명 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 차세대 ERP 연동 및 결재 API 고도화"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent transition-all"
            />
          </div>

          {/* Category & Assignee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-stone-400" />
                카테고리 구분
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">+ 직접 입력...</option>
              </select>
              {category === '__custom__' && (
                <input
                  type="text"
                  placeholder="새 카테고리명 입력"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-rose-400 rounded-md focus:ring-2 focus:ring-rose-400"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                담당자
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                {assignees.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
                <option value="__custom__">+ 직접 입력...</option>
              </select>
              {assignee === '__custom__' && (
                <input
                  type="text"
                  placeholder="담당자 이름 직급 입력"
                  value={customAssignee}
                  onChange={(e) => setCustomAssignee(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-rose-400 rounded-md focus:ring-2 focus:ring-rose-400"
                />
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                시작일
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                종료일 (목표일)
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>
          </div>

          {/* Status & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-stone-400" />
                과제 상태
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-rose-400"
              >
                <option value="normal">정상 (일정 준수)</option>
                <option value="delayed">지연 (일정 차질/지연)</option>
                <option value="completed">완료 (업무 종료)</option>
                <option value="hold">보류 (일시 중단)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                  현재 진척률
                </label>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                  {progress}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="w-full h-2 bg-[#E2D8CC] rounded-lg appearance-none cursor-pointer accent-rose-600 mt-2"
              />
            </div>
          </div>

          {/* Optional initial this week entry if creating new task */}
          {!isEditing && (
            <div className="mt-4 pt-4 border-t border-[#E8DFD5] space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-700">
                <Clock className="w-3.5 h-3.5 text-rose-600" />
                이번 주 실적 및 차주 계획 (선택 사항)
              </div>
              <textarea
                rows={2}
                placeholder="금주 실적 (예: - 1차 인터페이스 규격 설계 완료)"
                value={thisWeekWork}
                onChange={(e) => setThisWeekWork(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-rose-400 focus:outline-none"
              />
              <textarea
                rows={2}
                placeholder="차주 계획 (예: - 통합 테스트 시나리오 작성 및 수행)"
                value={nextWeekPlan}
                onChange={(e) => setNextWeekPlan(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#E2D8CC] rounded-lg text-xs text-stone-900 focus:ring-2 focus:ring-rose-400 focus:outline-none"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#E8DFD5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-800 bg-[#EFE8DF] hover:bg-[#E2D7CC] rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-lg shadow-sm transition-all"
            >
              {isEditing ? '변경사항 저장' : '과제 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
