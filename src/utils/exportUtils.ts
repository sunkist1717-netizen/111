import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, TextRun, AlignmentType, BorderStyle } from 'docx';
import { Task, WeekInfo, VisibleColumns } from '../types/report';
import { formatDateRange } from './dateUtils';

interface ReportRow {
  category: string;
  title: string;
  assignee: string;
  period: string;
  thisWeekWork: string;
  nextWeekPlan: string;
  progress: number;
  status: string;
  issues: string;
}

const STATUS_LABELS: Record<string, string> = {
  normal: '정상',
  delayed: '지연',
  completed: '완료',
  hold: '보류',
};

/**
 * Prepares weekly report data rows based on tasks and selected week
 */
export function prepareWeeklyReportRows(tasks: Task[], week: WeekInfo): { rows: ReportRow[]; issuesList: Array<{ title: string; assignee: string; issues: string }> } {
  const rows: ReportRow[] = [];
  const issuesList: Array<{ title: string; assignee: string; issues: string }> = [];

  tasks.forEach((task) => {
    const record = task.weeklyRecords[week.id];
    // If no record exists for this week, we only show it if the task was active during this week
    if (!record && task.status === 'completed' && task.endDate < week.startDate) {
      return;
    }

    const thisWeekWork = record?.thisWeekWork || '-';
    const nextWeekPlan = record?.nextWeekPlan || '-';
    const progress = record?.progress !== undefined ? record.progress : task.progress;
    const status = record?.status || task.status;
    const issues = record?.issues?.trim() || '';

    rows.push({
      category: task.category,
      title: task.title,
      assignee: task.assignee,
      period: `${task.startDate.slice(5)} ~ ${task.endDate.slice(5)}`,
      thisWeekWork,
      nextWeekPlan,
      progress,
      status: STATUS_LABELS[status] || status,
      issues,
    });

    if (issues && issues !== '-' && issues.toLowerCase() !== '없음') {
      issuesList.push({
        title: task.title,
        assignee: task.assignee,
        issues,
      });
    }
  });

  return { rows, issuesList };
}

/**
 * Copies formatted HTML Table and Plain text to Clipboard
 */
export async function copyTableToClipboard(
  title: string,
  periodText: string,
  rows: ReportRow[],
  issuesList: Array<{ title: string; assignee: string; issues: string }>,
  columns: VisibleColumns
): Promise<boolean> {
  try {
    // Generate styled HTML for clipboard
    let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1e293b; max-width: 950px; margin: 0 auto; line-height: 1.5;">
      <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 4px; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 6px;">
        ${title}
      </h2>
      <p style="font-size: 13px; color: #64748b; margin-top: 0; margin-bottom: 16px;">
        ■ 보고 기간: ${periodText}
      </p>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 24px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #334155; border-bottom: 2px solid #cbd5e1;">
            ${columns.category ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; width: 11%;">구분</th>' : ''}
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 18%;">과제명</th>
            ${columns.assignee ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; width: 10%;">담당자</th>' : ''}
            ${columns.period ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; width: 11%;">일정</th>' : ''}
            ${columns.thisWeekWork ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 26%;">금주 실적</th>' : ''}
            ${columns.nextWeekPlan ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; width: 24%;">차주 계획</th>' : ''}
            ${columns.progress ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; width: 7%;">진척률</th>' : ''}
            ${columns.status ? '<th style="border: 1px solid #cbd5e1; padding: 8px 10px; text-align: center; width: 7%;">상태</th>' : ''}
          </tr>
        </thead>
        <tbody>
    `;

    rows.forEach((r, idx) => {
      const bg = idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
      const statusColor = r.status === '지연' ? 'color: #dc2626; font-weight: bold;' : r.status === '완료' ? 'color: #16a34a;' : 'color: #2563eb;';

      html += `
        <tr style="${bg}">
          ${columns.category ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; font-weight: 500;">${r.category}</td>` : ''}
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; font-weight: 600;">${r.title}</td>
          ${columns.assignee ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center;">${r.assignee}</td>` : ''}
          ${columns.period ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; font-size: 11px; color: #64748b;">${r.period}</td>` : ''}
          ${columns.thisWeekWork ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; white-space: pre-line;">${r.thisWeekWork}</td>` : ''}
          ${columns.nextWeekPlan ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; white-space: pre-line;">${r.nextWeekPlan}</td>` : ''}
          ${columns.progress ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; font-weight: 600;">${r.progress}%</td>` : ''}
          ${columns.status ? `<td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; ${statusColor}">${r.status}</td>` : ''}
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    if (issuesList.length > 0) {
      html += `
        <div style="margin-top: 18px; border: 1px solid #fed7aa; background-color: #fff7ed; padding: 12px 16px; border-radius: 4px;">
          <h4 style="font-size: 13px; font-weight: bold; color: #9a3412; margin: 0 0 8px 0;">■ 주요 이슈 및 협조 요청사항</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #7c2d12;">
      `;
      issuesList.forEach((item) => {
        html += `<li style="margin-bottom: 4px;"><strong>[${item.title} / ${item.assignee}]</strong> ${item.issues}</li>`;
      });
      html += `
          </ul>
        </div>
      `;
    }

    html += `</div>`;

    // Plain text version
    let plainText = `[${title}]\n기간: ${periodText}\n\n`;
    rows.forEach((r) => {
      plainText += `▶ [${r.category}] ${r.title} (${r.assignee} | ${r.status} | ${r.progress}%)\n`;
      plainText += `[금주 실적]\n${r.thisWeekWork}\n`;
      plainText += `[차주 계획]\n${r.nextWeekPlan}\n`;
      if (r.issues && r.issues !== '없음') {
        plainText += `[이슈사항] ${r.issues}\n`;
      }
      plainText += `----------------------------------------\n`;
    });

    if (issuesList.length > 0) {
      plainText += `\n■ 주요 이슈 및 부서간 협조 요청사항:\n`;
      issuesList.forEach((it) => {
        plainText += `- [${it.title} / ${it.assignee}] ${it.issues}\n`;
      });
    }

    // Write both HTML and text to clipboard
    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const htmlBlob = new Blob([html], { type: 'text/html' });

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      }),
    ]);

    return true;
  } catch (e) {
    console.error('Clipboard copy error:', e);
    // Fallback simple writeText
    return false;
  }
}

/**
 * Downloads Excel (.xlsx) file
 */
export function exportToExcel(
  title: string,
  periodText: string,
  rows: ReportRow[],
  issuesList: Array<{ title: string; assignee: string; issues: string }>,
  columns: VisibleColumns,
  filename: string
) {
  const wsData: any[][] = [];

  // Title and header
  wsData.push([title]);
  wsData.push([`보고 기간: ${periodText}`]);
  wsData.push([]); // blank row

  // Table header
  const tableHeader: string[] = [];
  if (columns.category) tableHeader.push('구분');
  tableHeader.push('과제명');
  if (columns.assignee) tableHeader.push('담당자');
  if (columns.period) tableHeader.push('일정');
  if (columns.thisWeekWork) tableHeader.push('금주 실적');
  if (columns.nextWeekPlan) tableHeader.push('차주 계획');
  if (columns.progress) tableHeader.push('진척률(%)');
  if (columns.status) tableHeader.push('상태');
  if (columns.issues) tableHeader.push('이슈 및 요청사항');
  wsData.push(tableHeader);

  // Table data
  rows.forEach((r) => {
    const rowItem: any[] = [];
    if (columns.category) rowItem.push(r.category);
    rowItem.push(r.title);
    if (columns.assignee) rowItem.push(r.assignee);
    if (columns.period) rowItem.push(r.period);
    if (columns.thisWeekWork) rowItem.push(r.thisWeekWork);
    if (columns.nextWeekPlan) rowItem.push(r.nextWeekPlan);
    if (columns.progress) rowItem.push(r.progress);
    if (columns.status) rowItem.push(r.status);
    if (columns.issues) rowItem.push(r.issues);
    wsData.push(rowItem);
  });

  if (issuesList.length > 0) {
    wsData.push([]);
    wsData.push(['■ 주요 이슈 및 협조 요청사항']);
    issuesList.forEach((it) => {
      wsData.push([`[${it.title} / ${it.assignee}]`, it.issues]);
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // 구분
    { wch: 30 }, // 과제명
    { wch: 14 }, // 담당자
    { wch: 16 }, // 일정
    { wch: 45 }, // 금주 실적
    { wch: 45 }, // 차주 계획
    { wch: 10 }, // 진척률
    { wch: 10 }, // 상태
    { wch: 35 }, // 이슈
  ];

  XLSX.utils.book_append_sheet(wb, ws, '업무보고');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Downloads Word (.docx) file
 */
export async function exportToWord(
  title: string,
  periodText: string,
  rows: ReportRow[],
  issuesList: Array<{ title: string; assignee: string; issues: string }>,
  columns: VisibleColumns,
  filename: string
) {
  const tableHeaderCells: TableCell[] = [];

  if (columns.category) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '구분', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 1200, type: WidthType.DXA },
      })
    );
  }

  tableHeaderCells.push(
    new TableCell({
      children: [new Paragraph({ children: [new TextRun({ text: '과제명', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
      width: { size: 2000, type: WidthType.DXA },
    })
  );

  if (columns.assignee) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '담당자', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 1100, type: WidthType.DXA },
      })
    );
  }

  if (columns.thisWeekWork) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '금주 실적', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 2800, type: WidthType.DXA },
      })
    );
  }

  if (columns.nextWeekPlan) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '차주 계획', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 2800, type: WidthType.DXA },
      })
    );
  }

  if (columns.progress) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '진척률', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 800, type: WidthType.DXA },
      })
    );
  }

  if (columns.status) {
    tableHeaderCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: '상태', bold: true, size: 20 })], alignment: AlignmentType.CENTER })],
        width: { size: 800, type: WidthType.DXA },
      })
    );
  }

  const tableRows: TableRow[] = [new TableRow({ children: tableHeaderCells })];

  rows.forEach((r) => {
    const rowCells: TableCell[] = [];

    if (columns.category) {
      rowCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: r.category, size: 19 })], alignment: AlignmentType.CENTER })],
        })
      );
    }

    rowCells.push(
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: r.title, bold: true, size: 19 })] })],
      })
    );

    if (columns.assignee) {
      rowCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: r.assignee, size: 19 })], alignment: AlignmentType.CENTER })],
        })
      );
    }

    if (columns.thisWeekWork) {
      const lines = r.thisWeekWork.split('\n');
      rowCells.push(
        new TableCell({
          children: lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 18 })] })),
        })
      );
    }

    if (columns.nextWeekPlan) {
      const lines = r.nextWeekPlan.split('\n');
      rowCells.push(
        new TableCell({
          children: lines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 18 })] })),
        })
      );
    }

    if (columns.progress) {
      rowCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: `${r.progress}%`, size: 19 })], alignment: AlignmentType.CENTER })],
        })
      );
    }

    if (columns.status) {
      rowCells.push(
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: r.status, size: 19, bold: r.status === '지연' })], alignment: AlignmentType.CENTER })],
        })
      );
    }

    tableRows.push(new TableRow({ children: rowCells }));
  });

  const children: any[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `보고 기간: ${periodText}`, color: '666666', size: 20 })],
      spacing: { after: 300 },
    }),
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    }),
  ];

  if (issuesList.length > 0) {
    children.push(
      new Paragraph({
        text: '■ 주요 이슈 및 협조 요청사항',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 120 },
      })
    );
    issuesList.forEach((it) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `• [${it.title} / ${it.assignee}] `, bold: true, size: 20 }),
            new TextRun({ text: it.issues, size: 20 }),
          ],
          spacing: { after: 80 },
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Monthly export utilities
 */
export async function copyMonthlyTableToClipboard(
  title: string,
  monthLabel: string,
  overview: string,
  tasks: Array<{
    category: string;
    title: string;
    assignee: string;
    startProgress: number;
    endProgress: number;
    status: string;
    monthlySummary: string;
    nextMonthPlan: string;
  }>
): Promise<boolean> {
  try {
    let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Malgun Gothic', '맑은 고딕', sans-serif; color: #1e293b; max-width: 950px; margin: 0 auto; line-height: 1.5;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 4px; color: #0f172a; border-bottom: 2px solid #2563eb; padding-bottom: 6px;">
        ${title} (${monthLabel})
      </h2>
    `;

    if (overview) {
      html += `
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
          <h4 style="margin: 0 0 6px 0; font-size: 13px; color: #1e3a8a;">■ 경영진 총평 (Executive Summary)</h4>
          <p style="margin: 0; font-size: 12px; white-space: pre-line; color: #334155;">${overview}</p>
        </div>
      `;
    }

    html += `
      <table style="width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 16px; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f1f5f9; color: #334155; border-bottom: 2px solid #cbd5e1;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 12%;">구분</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 18%;">과제명</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 10%;">담당자</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 10%;">진척도 변화</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 28%;">월간 주요 실적</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 10px; width: 22%;">익월 계획</th>
          </tr>
        </thead>
        <tbody>
    `;

    tasks.forEach((t, idx) => {
      const bg = idx % 2 === 1 ? 'background-color: #f8fafc;' : 'background-color: #ffffff;';
      const progressDiff = t.endProgress - t.startProgress;
      const diffText = progressDiff > 0 ? `(+${progressDiff}%p)` : '';

      html += `
        <tr style="${bg}">
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; font-weight: 500;">${t.category}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; font-weight: 600;">${t.title}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center;">${t.assignee}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; text-align: center; font-size: 11px;">
            ${t.startProgress}% → <strong>${t.endProgress}%</strong><br/><span style="color: #2563eb;">${diffText}</span>
          </td>
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; white-space: pre-line;">${t.monthlySummary}</td>
          <td style="border: 1px solid #e2e8f0; padding: 8px 10px; white-space: pre-line;">${t.nextMonthPlan}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    </div>
    `;

    let plainText = `[${title} - ${monthLabel}]\n\n`;
    if (overview) {
      plainText += `■ 경영진 총평:\n${overview}\n\n`;
    }
    tasks.forEach((t) => {
      plainText += `▶ [${t.category}] ${t.title} (${t.assignee} | 진척: ${t.startProgress}% → ${t.endProgress}%)\n`;
      plainText += `[월간 실적]\n${t.monthlySummary}\n`;
      plainText += `[익월 계획]\n${t.nextMonthPlan}\n`;
      plainText += `----------------------------------------\n`;
    });

    const textBlob = new Blob([plainText], { type: 'text/plain' });
    const htmlBlob = new Blob([html], { type: 'text/html' });

    await navigator.clipboard.write([
      new ClipboardItem({
        'text/plain': textBlob,
        'text/html': htmlBlob,
      }),
    ]);
    return true;
  } catch (e) {
    console.error('Monthly copy error:', e);
    return false;
  }
}

export function exportMonthlyToExcel(
  title: string,
  monthLabel: string,
  overview: string,
  tasks: Array<{
    category: string;
    title: string;
    assignee: string;
    startProgress: number;
    endProgress: number;
    status: string;
    monthlySummary: string;
    nextMonthPlan: string;
  }>,
  filename: string
) {
  const wsData: any[][] = [];

  wsData.push([`${title} (${monthLabel})`]);
  if (overview) {
    wsData.push(['■ 경영진 총평']);
    wsData.push([overview]);
  }
  wsData.push([]);

  wsData.push(['구분', '과제명', '담당자', '월초 진척률', '월말 진척률', '진척 변동', '상태', '월간 주요 실적', '익월 계획']);

  tasks.forEach((t) => {
    const diff = t.endProgress - t.startProgress;
    wsData.push([
      t.category,
      t.title,
      t.assignee,
      `${t.startProgress}%`,
      `${t.endProgress}%`,
      `+${diff}%p`,
      STATUS_LABELS[t.status] || t.status,
      t.monthlySummary,
      t.nextMonthPlan,
    ]);
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 50 },
    { wch: 45 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, '월간보고');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export async function exportMonthlyToWord(
  title: string,
  monthLabel: string,
  overview: string,
  tasks: Array<{
    category: string;
    title: string;
    assignee: string;
    startProgress: number;
    endProgress: number;
    status: string;
    monthlySummary: string;
    nextMonthPlan: string;
  }>,
  filename: string
) {
  const tableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '구분', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 1200, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '과제명', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 2000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '담당자', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 1100, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '진척도', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 1100, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '월간 주요 실적', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 3000, type: WidthType.DXA } }),
        new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '익월 계획', bold: true, size: 20 })], alignment: AlignmentType.CENTER })], width: { size: 2600, type: WidthType.DXA } }),
      ],
    }),
  ];

  tasks.forEach((t) => {
    const summaryLines = t.monthlySummary.split('\n');
    const planLines = t.nextMonthPlan.split('\n');

    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.category, size: 19 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.title, bold: true, size: 19 })] })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: t.assignee, size: 19 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `${t.startProgress}% → ${t.endProgress}%`, size: 18 })], alignment: AlignmentType.CENTER })] }),
          new TableCell({ children: summaryLines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 18 })] })) }),
          new TableCell({ children: planLines.map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 18 })] })) }),
        ],
      })
    );
  });

  const children: any[] = [
    new Paragraph({
      text: `${title} (${monthLabel})`,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 200 },
    }),
  ];

  if (overview) {
    children.push(
      new Paragraph({
        text: '■ 경영진 월간 총평 (Executive Summary)',
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
      new Paragraph({
        children: overview.split('\n').map((l) => new Paragraph({ children: [new TextRun({ text: l, size: 20 })] })),
        spacing: { after: 300 },
      })
    );
  }

  children.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
