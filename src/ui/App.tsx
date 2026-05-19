import React, { useState, useEffect, useCallback } from 'react';
import type { ParsedBoard, ControllerToUIMessage, ParseSummary } from '../types';
import { generateAndDownloadExcel } from './utils/excelExport';

type AppState = 'idle' | 'parsing' | 'parsed' | 'error';

function computeSummary(board: ParsedBoard): ParseSummary {
  const contextCounts: Record<string, number> = {};
  for (const entry of board.context) {
    contextCounts[entry.category] = (contextCounts[entry.category] || 0) + 1;
  }
  return {
    roleCount: board.roles.length,
    totalObjectives: board.roles.reduce((sum, r) => sum + r.objectives.length, 0),
    totalPainPoints: board.roles.reduce((sum, r) => sum + r.painPoints.length, 0),
    totalTools: board.roles.reduce((sum, r) => sum + r.tools.length, 0),
    contextCounts,
  };
}

const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    style={{
      transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
    }}
  >
    <path
      d="M5 3L9 7L5 11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CollapsibleSection: React.FC<{
  title: string;
  badge?: string | number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, badge, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--figma-color-border)] rounded-lg overflow-hidden">
      <div
        className="section-header"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          <ChevronIcon expanded={open} />
          <span className="text-xs font-semibold" style={{ color: 'var(--figma-color-text)' }}>
            {title}
          </span>
        </div>
        {badge !== undefined && <span className="stat-badge">{badge}</span>}
      </div>
      {open && (
        <div className="px-3 pb-3 anim-fade-in">
          {children}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [state, setState] = useState<AppState>('idle');
  const [board, setBoard] = useState<ParsedBoard | null>(null);
  const [summary, setSummary] = useState<ParseSummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as ControllerToUIMessage | undefined;
      if (!msg) return;

      switch (msg.type) {
        case 'PARSING_STARTED':
          setState('parsing');
          break;

        case 'BOARD_DATA':
          setBoard(msg.payload);
          setSummary(computeSummary(msg.payload));
          setState('parsed');
          break;

        case 'PARSE_ERROR':
          setErrorMsg(msg.message);
          setState('error');
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const handleParseBoard = useCallback(() => {
    setState('parsing');
    setErrorMsg('');
    parent.postMessage({ pluginMessage: { type: 'PARSE_BOARD' } }, '*');
  }, []);

  const handleExport = useCallback(() => {
    if (!board) return;
    generateAndDownloadExcel(board);
  }, [board]);

  return (
    <div className="flex flex-col h-screen p-4 gap-4 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-bold" style={{ color: 'var(--figma-color-text)' }}>
          Frame Export
        </h1>
        <p className="text-xs" style={{ color: 'var(--figma-color-text-secondary)' }}>
          Parse frame data and export to a structured Excel workbook for Copilot.
        </p>
      </div>

      {/* Parse Button */}
      <button
        className="btn-primary"
        onClick={handleParseBoard}
        disabled={state === 'parsing'}
      >
        {state === 'parsing' ? 'Parsing Board…' : 'Parse Board'}
      </button>

      {/* Error */}
      {state === 'error' && (
        <div className="anim-fade-in rounded-lg p-3 text-xs border border-red-200"
          style={{ background: '#fef2f2', color: '#dc2626' }}>
          <span className="font-semibold">Error:</span> {errorMsg}
        </div>
      )}

      {/* Results */}
      {state === 'parsed' && summary && board && (
        <div className="flex flex-col gap-3 anim-fade-in">
          {/* Summary Card */}
          <div className="card p-3">
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--figma-color-text)' }}>
              Parsed Summary
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SummaryItem label="Roles" value={summary.roleCount} />
              <SummaryItem label="Objectives" value={summary.totalObjectives} />
              <SummaryItem label="Pain Points" value={summary.totalPainPoints} />
              <SummaryItem label="Tools" value={summary.totalTools} />
            </div>
          </div>

          {/* Data Preview */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold" style={{ color: 'var(--figma-color-text-secondary)' }}>
              Data Preview
            </div>

            {board.roles.map((role) => (
              <CollapsibleSection
                key={role.roleId}
                title={`Role ${role.roleId}: ${role.name || '(unnamed)'}`}
                badge={role.objectives.length + role.painPoints.length + role.tools.length}
              >
                <div className="flex flex-col gap-2 mt-1">
                  {role.objectives.length > 0 && (
                    <DataList label="Objectives" items={role.objectives} />
                  )}
                  {role.painPoints.length > 0 && (
                    <DataList label="Pain Points" items={role.painPoints} />
                  )}
                  {role.tools.length > 0 && (
                    <DataList label="Tools" items={role.tools} />
                  )}
                  {role.objectives.length === 0 && role.painPoints.length === 0 && role.tools.length === 0 && (
                    <span className="text-xs italic" style={{ color: 'var(--figma-color-text-tertiary)' }}>
                      No data found for this role
                    </span>
                  )}
                </div>
              </CollapsibleSection>
            ))}

            {Object.entries(summary.contextCounts).map(([category, count]) => (
              <CollapsibleSection key={category} title={category} badge={count}>
                <div className="flex flex-col gap-1 mt-1">
                  {board.context
                    .filter((e) => e.category === category)
                    .map((e, i) => (
                      <div
                        key={i}
                        className="text-xs py-1 px-2 rounded"
                        style={{ background: 'var(--figma-color-bg-secondary)', color: 'var(--figma-color-text)' }}
                      >
                        {e.text}
                      </div>
                    ))}
                </div>
              </CollapsibleSection>
            ))}
          </div>

          {/* Export Button */}
          <button className="btn-export" onClick={handleExport}>
            Export to Excel
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--figma-color-text-tertiary)' }}>
            Generates a .xlsx file with 6 sheets (1 master + 5 prompts)
          </p>
        </div>
      )}
    </div>
  );
}

const SummaryItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div
    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg"
    style={{ background: 'var(--figma-color-bg-secondary)' }}
  >
    <span className="text-xs" style={{ color: 'var(--figma-color-text-secondary)' }}>{label}</span>
    <span className="text-xs font-bold" style={{ color: 'var(--figma-color-text)' }}>{value}</span>
  </div>
);

const DataList: React.FC<{ label: string; items: string[] }> = ({ label, items }) => (
  <div>
    <div className="text-xs font-medium mb-1" style={{ color: 'var(--figma-color-text-secondary)' }}>
      {label}
    </div>
    <div className="flex flex-col gap-1">
      {items.map((item, i) => (
        <div
          key={i}
          className="text-xs py-1 px-2 rounded"
          style={{ background: 'var(--figma-color-bg-secondary)', color: 'var(--figma-color-text)' }}
        >
          {item}
        </div>
      ))}
    </div>
  </div>
);
