import { useEffect, useState } from 'react';
import type { HexagramResult, HexagramInput, YaoType, DongYaoSelectionMode } from '../types';
import { dateToGanzhi } from '../lib/ganzhi';
import { modernCoin, ancientCoin, numberMethod } from '../lib/divination';
import { buildHexagramResult } from '../lib/hexagram';
import {
  loadHistory, updateEntry, removeEntry, FEEDBACK_MAX_LENGTH,
  type HistoryEntry, type AccuracyMark,
} from '../lib/historyStore';
import { GanzhiBar } from './GanzhiBar';
import { HexagramBoard } from './HexagramBoard';
import { JudgmentPanel } from './JudgmentPanel';

function dongYaoModeLabel(m?: DongYaoSelectionMode): string {
  switch (m) {
    case 'relation': return '关系优先';
    case 'energy':   return '能量优先';
    case 'average':
    default:         return '平均原则';
  }
}

function AccuracyBadge({ mark, compact }: { mark: AccuracyMark; compact?: boolean }) {
  const color = mark === 'accurate' ? 'var(--success)' : 'var(--error)';
  const label = mark === 'accurate' ? '准' : '不准';
  return (
    <span style={{
      fontSize: compact ? 10 : 11,
      color,
      fontWeight: 600,
      padding: compact ? '1px 5px' : '2px 8px',
      border: `1px solid ${color}`,
      borderRadius: 4,
      letterSpacing: 1,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

interface Props {
  onBack: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatSaved(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 从历史条目重建排盘结果
function rebuildResult(entry: HistoryEntry): HexagramResult {
  const time = new Date(entry.time);
  const ganzhi = dateToGanzhi(time);
  let yaoCodes: YaoType[];
  if (entry.method === 'modern' || entry.method === 'manual') yaoCodes = modernCoin(entry.coinsInput || '111111');
  else if (entry.method === 'ancient') yaoCodes = ancientCoin(entry.coinsInput || '111111');
  else yaoCodes = numberMethod(entry.coinsInput || '0 0', time);
  const input: HexagramInput = {
    matter: entry.matter, category: entry.category, time,
    method: entry.method, coinsInput: entry.coinsInput,
    dongYaoMode: entry.dongYaoMode ?? 'average',
  };
  return buildHexagramResult(input, yaoCodes, ganzhi);
}

export function HistoryView({ onBack }: Props) {
  const [list, setList] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editMatter, setEditMatter] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [editAccuracy, setEditAccuracy] = useState<AccuracyMark | undefined>(undefined);

  useEffect(() => { setList(loadHistory()); }, []);

  const active = list.find(e => e.id === activeId) ?? null;

  function enterEdit() {
    if (!active) return;
    setEditMatter(active.matter);
    setEditFeedback(active.feedback);
    setEditAccuracy(active.accuracy);
    setEditing(true);
  }

  function saveEdit() {
    if (!active) return;
    const updated = updateEntry(active.id, {
      matter: editMatter.trim(),
      feedback: editFeedback.trim(),
      accuracy: editAccuracy,
    });
    if (updated) {
      setList(loadHistory());
      setEditing(false);
    }
  }

  function deleteEntry() {
    if (!active) return;
    if (!confirm('确认删除这条记录？')) return;
    removeEntry(active.id);
    setList(loadHistory());
    setActiveId(null);
  }

  // ── 列表视图 ──
  if (!active) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 300ms ease-out' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>历史记录</span>
          <button type="button" className="btn-secondary" onClick={onBack} style={{ fontSize: 12, padding: '4px 12px' }}>
            返回起卦
          </button>
        </div>
        {list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '40px 20px' }}>
            暂无保存的记录。在起卦结果页面点击"保存记录"即可加入历史。
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {list.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => { setActiveId(e.id); setEditing(false); }}
                style={{
                  textAlign: 'left',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-soft)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 14, color: 'var(--yao-red)', fontWeight: 600 }}>
                    {e.origName ?? '—'}
                    {e.changedName && <span style={{ color: 'var(--text-muted)', fontWeight: 400, margin: '0 4px' }}>→</span>}
                    {e.changedName && <span style={{ color: 'var(--yao-blue)' }}>{e.changedName}</span>}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {e.accuracy && <AccuracyBadge mark={e.accuracy} compact />}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>保存于 {formatSaved(e.savedAt)}</span>
                  </span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--gold-mid)' }}>[{e.category}]</span>
                  <span style={{ marginLeft: 8 }}>{e.matter || '（未填事项）'}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>起卦：{formatTime(e.time)}</span>
                  <span>· 多动爻：{dongYaoModeLabel(e.dongYaoMode)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 详情视图 ──
  const rebuilt = rebuildResult(active);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 300ms ease-out' }}>
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <button type="button" className="btn-secondary" onClick={() => setActiveId(null)} style={{ fontSize: 12, padding: '4px 12px' }}>
          ← 返回列表
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          {!editing ? (
            <>
              <button type="button" onClick={enterEdit} style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 6,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--gold-mid)', cursor: 'pointer',
              }}>
                修改
              </button>
              <button type="button" onClick={deleteEntry} style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 6,
                border: '1px solid rgba(184,50,50,0.4)', background: 'transparent',
                color: 'var(--error)', cursor: 'pointer',
              }}>
                删除
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-primary" onClick={saveEdit} style={{ fontSize: 12, padding: '4px 12px' }}>
                ✓ 保存修改
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditing(false)} style={{ fontSize: 12, padding: '4px 12px' }}>
                取消
              </button>
            </>
          )}
        </div>
      </div>

      {/* 事项 */}
      <div className="card" style={{ fontSize: 13 }}>
        {!editing ? (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>咨询事项：</span>
            <span style={{ color: 'var(--text-secondary)' }}>{active.matter || '（未填）'}</span>
            <span style={{ marginLeft: 12, color: 'var(--gold-mid)', fontSize: 12 }}>[{active.category}]</span>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 11, color: 'var(--text-muted)' }}>咨询事项（最多 250 字）</label>
            <textarea
              className="input-field"
              maxLength={250}
              style={{ resize: 'vertical', minHeight: 60 }}
              value={editMatter}
              onChange={e => setEditMatter(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* 起卦时间 + 摇卦数据 + 高级选项 */}
      <div className="card" style={{ fontSize: 13 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>起卦时间：
          <span style={{ color: 'var(--text-secondary)', marginLeft: 4 }}>{formatTime(active.time)}</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>
          摇卦数据：
          <span style={{
            color: 'var(--text-primary)', fontFamily: 'monospace',
            fontSize: 14, letterSpacing: 2, marginLeft: 4,
          }}>{active.coinsInput || '—'}</span>
          <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>（{methodCN(active.method)}）</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>高级选项：</span>
          <span style={{
            color: 'var(--yao-blue)',
            border: '1px solid var(--yao-blue-border)',
            background: 'var(--yao-blue-bg)',
            borderRadius: 4, padding: '1px 6px', letterSpacing: 1, fontWeight: 500,
          }}>
            多动爻选取 · {dongYaoModeLabel(active.dongYaoMode)}
          </span>
        </div>
      </div>

      <div className="card">
        <GanzhiBar ganzhi={rebuilt.ganzhi} tombFill={rebuilt.tombFill} />
      </div>
      <HexagramBoard result={rebuilt} />
      <JudgmentPanel result={rebuilt} />

      {/* 事后反馈 */}
      <div className="card">
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>事后反馈</span>
          {!editing && active.accuracy && <AccuracyBadge mark={active.accuracy} />}
        </div>
        {!editing ? (
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
            {active.feedback || '（未填）'}
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <EditAccuracyButton
                active={editAccuracy === 'accurate'}
                onClick={() => setEditAccuracy(editAccuracy === 'accurate' ? undefined : 'accurate')}
                label="准"
                activeColor="var(--success)"
              />
              <EditAccuracyButton
                active={editAccuracy === 'inaccurate'}
                onClick={() => setEditAccuracy(editAccuracy === 'inaccurate' ? undefined : 'inaccurate')}
                label="不准"
                activeColor="var(--error)"
              />
            </div>
            <textarea
              className="input-field"
              maxLength={FEEDBACK_MAX_LENGTH}
              style={{ resize: 'vertical', minHeight: 100, width: '100%' }}
              value={editFeedback}
              onChange={e => setEditFeedback(e.target.value)}
              placeholder="记录事后发生的情况、应验或不应验之处…"
            />
            <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {editFeedback.length}/{FEEDBACK_MAX_LENGTH}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function methodCN(m: import('../types').DivinationMethod): string {
  switch (m) {
    case 'modern':  return '现代硬币摇卦';
    case 'ancient': return '古代钱币摇卦';
    case 'number':  return '起数法';
    case 'manual':  return '手动输入';
  }
}

function EditAccuracyButton({ active, onClick, label, activeColor }: {
  active: boolean; onClick: () => void; label: string; activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        fontSize: 13,
        fontWeight: active ? 600 : 500,
        padding: '6px 0',
        borderRadius: 6,
        border: `1px solid ${active ? activeColor : 'var(--border)'}`,
        background: active ? `${activeColor}1A` : 'transparent',
        color: active ? activeColor : 'var(--text-secondary)',
        cursor: 'pointer',
        transition: 'all 150ms',
      }}
    >
      {label}
    </button>
  );
}
