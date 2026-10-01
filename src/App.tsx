/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Menu, Plus, Bell, Check, Sparkles } from 'lucide-react';
import { AppData, AppSettings, Task, TaskStatus, WeekInfo, WeeklyRecord, ReportStatus } from './types/report';
import { getCurrentWeekInfo } from './utils/dateUtils';
import { loadAppData, saveAppData, resetToSampleData, clearAllData } from './utils/storage';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { WeeklyInputView } from './components/WeeklyInputView';
import { WeeklyReportView } from './components/WeeklyReportView';
import { MonthlyReportView } from './components/MonthlyReportView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { TaskModal } from './components/TaskModal';
import { ConfirmModal } from './components/ConfirmModal';

export default function App() {
  const currentWeek = getCurrentWeekInfo();

  // App persistent state
  const [data, setData] = useState<AppData>(() => loadAppData());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo>(currentWeek);

  // Auto-save feedback state
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'idle'>('saved');
  const autoSaveTimerRef = useRef<any>(null);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Confirm Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDanger?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Persist to storage with debounce indicator
  const persistData = (newData: AppData) => {
    setData(newData);
    setAutoSaveStatus('saving');
    saveAppData(newData);

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      setAutoSaveStatus('saved');
    }, 400);
  };

  // Task Weekly Record Update
  const handleUpdateWeeklyRecord = (
    taskId: string,
    record: WeeklyRecord,
    updatedProgress?: number,
    updatedStatus?: TaskStatus
  ) => {
    const updatedTasks = data.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const newWeeklyRecords = {
        ...task.weeklyRecords,
        [selectedWeek.id]: record,
      };

      return {
        ...task,
        progress: updatedProgress !== undefined ? updatedProgress : record.progress !== undefined ? record.progress : task.progress,
        status: updatedStatus !== undefined ? updatedStatus : record.status || task.status,
        weeklyRecords: newWeeklyRecords,
        updatedAt: new Date().toISOString(),
      };
    });

    persistData({
      ...data,
      tasks: updatedTasks,
    });
  };

  // Task creation or update
  const handleSaveTask = (
    taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'weeklyRecords' | 'monthlySummaries'>,
    initialRecord?: { thisWeekWork: string; nextWeekPlan: string }
  ) => {
    if (editingTask) {
      // Update existing
      const updatedTasks = data.tasks.map((t) => {
        if (t.id !== editingTask.id) return t;
        return {
          ...t,
          ...taskData,
          updatedAt: new Date().toISOString(),
        };
      });
      persistData({ ...data, tasks: updatedTasks });
    } else {
      // Create new
      const newId = `task-${Date.now()}`;
      const nowIso = new Date().toISOString();

      const newWeeklyRecords: Record<string, WeeklyRecord> = {};
      if (initialRecord && (initialRecord.thisWeekWork || initialRecord.nextWeekPlan)) {
        newWeeklyRecords[selectedWeek.id] = {
          thisWeekWork: initialRecord.thisWeekWork,
          nextWeekPlan: initialRecord.nextWeekPlan,
          issues: '',
          progress: taskData.progress,
          status: taskData.status,
          updatedAt: nowIso,
        };
      }

      const newTask: Task = {
        id: newId,
        ...taskData,
        weeklyRecords: newWeeklyRecords,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      persistData({
        ...data,
        tasks: [newTask, ...data.tasks],
      });
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  // Delete Task with Confirmation
  const handleDeleteTask = (taskId: string, title: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: '과제를 삭제하시겠습니까?',
      message: `"${title}" 과제 및 관련된 모든 주간 실적 데이터가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`,
      isDanger: true,
      onConfirm: () => {
        const filtered = data.tasks.filter((t) => t.id !== taskId);
        persistData({ ...data, tasks: filtered });
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Monthly Task Summary Update
  const handleUpdateMonthlySummary = (
    taskId: string,
    monthId: string,
    summary: string,
    nextMonthPlan: string
  ) => {
    const updatedTasks = data.tasks.map((task) => {
      if (task.id !== taskId) return task;
      return {
        ...task,
        monthlySummaries: {
          ...(task.monthlySummaries || {}),
          [monthId]: {
            summary,
            nextMonthPlan,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });

    persistData({ ...data, tasks: updatedTasks });
  };

  // Monthly Overview Update
  const handleUpdateMonthlyOverview = (monthId: string, overview: string) => {
    const updatedSettings: AppSettings = {
      ...data.settings,
      monthlyOverviews: {
        ...(data.settings.monthlyOverviews || {}),
        [monthId]: overview,
      },
    };
    persistData({ ...data, settings: updatedSettings });
  };

  // Report status update for selected week
  const handleChangeReportStatus = (status: ReportStatus) => {
    const updatedSettings: AppSettings = {
      ...data.settings,
      reportStatusByWeek: {
        ...(data.settings.reportStatusByWeek || {}),
        [selectedWeek.id]: status,
      },
    };
    persistData({ ...data, settings: updatedSettings });
  };

  // Settings update
  const handleUpdateSettings = (newSettings: AppSettings) => {
    persistData({ ...data, settings: newSettings });
  };

  // Sample data reset
  const handleResetSampleData = () => {
    const sample = resetToSampleData();
    setData(sample);
  };

  // Clear all data
  const handleClearAllData = () => {
    const empty = clearAllData();
    setData(empty);
  };

  const reportStatusForWeek: ReportStatus =
    data.settings.reportStatusByWeek?.[selectedWeek.id] || 'writing';

  return (
    <div className="flex h-screen bg-[#FAF7F2] text-stone-900 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentWeek={currentWeek}
        teamName={data.settings.teamName}
        reportStatus={reportStatusForWeek}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        autoSaveStatus={autoSaveStatus}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header Bar for Mobile Hamburger & Quick Status */}
        <header className="h-14 bg-white border-b border-[#E8DFD5] px-4 md:px-8 flex items-center justify-between shrink-0 lg:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-[#FAF6F1]"
              title="메뉴 열기"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-extrabold text-sm text-stone-900">
              업무보고 자동화 시스템
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              className="px-2.5 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              새 과제
            </button>
          </div>
        </header>

        {/* Scrollable Main View Container */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {currentTab === 'dashboard' && (
            <DashboardView
              tasks={data.tasks}
              currentWeek={currentWeek}
              reportStatus={reportStatusForWeek}
              onChangeReportStatus={handleChangeReportStatus}
              onNavigateTab={setCurrentTab}
              onOpenNewTaskModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onSelectTaskToEdit={(task) => {
                setEditingTask(task);
                setIsTaskModalOpen(true);
              }}
            />
          )}

          {currentTab === 'weekly-input' && (
            <WeeklyInputView
              tasks={data.tasks}
              currentWeek={currentWeek}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              onUpdateWeeklyRecord={handleUpdateWeeklyRecord}
              onOpenNewTaskModal={() => {
                setEditingTask(null);
                setIsTaskModalOpen(true);
              }}
              onDeleteTask={handleDeleteTask}
              categories={data.settings.categories}
              assignees={data.settings.assignees}
            />
          )}

          {currentTab === 'weekly-report' && (
            <WeeklyReportView
              tasks={data.tasks}
              selectedWeek={selectedWeek}
              onSelectWeek={setSelectedWeek}
              settings={data.settings}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'monthly-report' && (
            <MonthlyReportView
              tasks={data.tasks}
              settings={data.settings}
              onUpdateMonthlySummary={handleUpdateMonthlySummary}
              onUpdateMonthlyOverview={handleUpdateMonthlyOverview}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              tasks={data.tasks}
              settings={data.settings}
              onSelectWeekToView={(week) => {
                setSelectedWeek(week);
                setCurrentTab('weekly-report');
              }}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={data.settings}
              onUpdateSettings={handleUpdateSettings}
              onResetSampleData={handleResetSampleData}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        task={editingTask}
        categories={data.settings.categories}
        assignees={data.settings.assignees}
        currentWeekId={selectedWeek.id}
        onSave={handleSaveTask}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
      />

      {/* Reusable Confirm Modal for dangerous actions */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        isDanger={confirmModalConfig.isDanger}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
