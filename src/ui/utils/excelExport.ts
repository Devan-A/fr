import * as XLSX from 'xlsx';
import type { ParsedBoard } from '../../types';
import { MASTER_PROMPT, PROMPTS } from './prompts';

/**
 * Builds Tab 1 data rows: project_id, role_id, role_name.
 */
function buildTab1(board: ParsedBoard): string[][] {
  const rows: string[][] = [['project_id', 'role_id', 'role_name']];
  for (const role of board.roles) {
    rows.push([board.projectId, String(role.roleId), role.name]);
  }
  return rows;
}

/**
 * Builds Tab 2 data rows: project_id, role_id, role_objective.
 * One row per objective per role.
 */
function buildTab2(board: ParsedBoard): string[][] {
  const rows: string[][] = [['project_id', 'role_id', 'role_objective']];
  for (const role of board.roles) {
    for (const obj of role.objectives) {
      rows.push([board.projectId, String(role.roleId), obj]);
    }
  }
  return rows;
}

/**
 * Builds Tab 3 data rows: project_id, role_id, pain_point.
 * One row per pain point per role.
 */
function buildTab3(board: ParsedBoard): string[][] {
  const rows: string[][] = [['project_id', 'role_id', 'pain_point']];
  for (const role of board.roles) {
    for (const pp of role.painPoints) {
      rows.push([board.projectId, String(role.roleId), pp]);
    }
  }
  return rows;
}

/**
 * Builds Tab 4 data rows: project_id, role_id, tools.
 * One row per tool per role.
 */
function buildTab4(board: ParsedBoard): string[][] {
  const rows: string[][] = [['project_id', 'role_id', 'tools']];
  for (const role of board.roles) {
    for (const tool of role.tools) {
      rows.push([board.projectId, String(role.roleId), tool]);
    }
  }
  return rows;
}

/**
 * Builds Tab 5 data rows: project_id, additional_context, category.
 * One row per context entry.
 */
function buildTab5(board: ParsedBoard): string[][] {
  const rows: string[][] = [['project_id', 'additional_context', 'category']];
  for (const entry of board.context) {
    rows.push([board.projectId, entry.text, entry.category]);
  }
  return rows;
}

/**
 * Adds a prompt text block followed by a gap and then data tables to a worksheet.
 * Returns the populated worksheet.
 */
function buildPromptSheet(
  promptTitle: string,
  promptText: string,
  dataTables: { label: string; rows: string[][] }[] | null
): XLSX.WorkSheet {
  const allRows: (string | null)[][] = [];

  allRows.push([promptTitle]);
  allRows.push([]);

  const promptLines = promptText.split('\n');
  for (const line of promptLines) {
    allRows.push([line]);
  }

  if (dataTables && dataTables.length > 0) {
    allRows.push([]);
    allRows.push(['═══════════════════════════════════════════════════════════']);
    allRows.push(['DATASET']);
    allRows.push(['═══════════════════════════════════════════════════════════']);

    for (const table of dataTables) {
      allRows.push([]);
      allRows.push([`── ${table.label} ──`]);
      for (const row of table.rows) {
        allRows.push(row);
      }
    }
  }

  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 80 },
    { wch: 20 },
    { wch: 60 },
  ];

  return ws;
}

/**
 * Generates a complete 6-sheet Excel workbook and triggers download.
 *
 * @param board - The parsed board data from the FigJam plugin controller.
 * @param projectId - Overridden project ID from the UI (if user changed it).
 */
export function generateAndDownloadExcel(board: ParsedBoard, projectId: string): void {
  const exportBoard = { ...board, projectId };

  const wb = XLSX.utils.book_new();

  const masterRows = MASTER_PROMPT.split('\n').map(line => [line]);
  const masterWs = XLSX.utils.aoa_to_sheet(masterRows);
  masterWs['!cols'] = [{ wch: 100 }];
  XLSX.utils.book_append_sheet(wb, masterWs, 'Master Prompt');

  const tab1 = buildTab1(exportBoard);
  const tab2 = buildTab2(exportBoard);
  const tab3 = buildTab3(exportBoard);
  const tab4 = buildTab4(exportBoard);
  const tab5 = buildTab5(exportBoard);

  const allDataTables = [
    { label: 'Tab 1 — Role Names', rows: tab1 },
    { label: 'Tab 2 — Role Objectives', rows: tab2 },
    { label: 'Tab 3 — Pain Points', rows: tab3 },
    { label: 'Tab 4 — Tools', rows: tab4 },
    { label: 'Tab 5 — Additional Context', rows: tab5 },
  ];

  const prompt1 = PROMPTS[2];
  const ws2 = buildPromptSheet(prompt1.title, prompt1.text, allDataTables);
  XLSX.utils.book_append_sheet(wb, ws2, 'P1 - Role Profiles');

  const prompt2 = PROMPTS[3];
  const ws3 = buildPromptSheet(prompt2.title, prompt2.text, allDataTables);
  XLSX.utils.book_append_sheet(wb, ws3, 'P2 - Human Problem');

  const prompt3 = PROMPTS[4];
  const ws4 = buildPromptSheet(prompt3.title, prompt3.text, null);
  XLSX.utils.book_append_sheet(wb, ws4, 'P3 - Biz Problem Update');

  const prompt4 = PROMPTS[5];
  const ws5 = buildPromptSheet(prompt4.title, prompt4.text, null);
  XLSX.utils.book_append_sheet(wb, ws5, 'P4 - Solution Hypotheses');

  const prompt5 = PROMPTS[6];
  const ws6 = buildPromptSheet(prompt5.title, prompt5.text, null);
  XLSX.utils.book_append_sheet(wb, ws6, 'P5 - Solutions & DVF');

  const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbOut], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const sanitizedName = projectId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${sanitizedName}_frame_export.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
