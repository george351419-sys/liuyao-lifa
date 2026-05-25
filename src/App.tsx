import { useState } from 'react';
import './index.css';
import type { HexagramInput, HexagramResult } from './types';
import { dateToGanzhi } from './lib/ganzhi';
import { modernCoin, ancientCoin, numberMethod } from './lib/divination';
import { buildHexagramResult } from './lib/hexagram';
import { addEntry } from './lib/historyStore';
import { InputForm } from './components/InputForm';
import { GanzhiBar } from './components/GanzhiBar';
import { HexagramBoard } from './components/HexagramBoard';
import { JudgmentPanel } from './components/JudgmentPanel';
import { HistoryView } from './components/HistoryView';

type View = 'main' | 'history';

function formatDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatDatetimeDisplay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function methodLabel(m: import('./types').DivinationMethod): string {
  switch (m) {
    case 'modern':  return '现代硬币摇卦';
    case 'ancient': return '古代钱币摇卦';
    case 'number':  return '起数法';
    case 'manual':  return '手动输入';
  }
}

function dongYaoModeLabel(m?: import('./types').DongYaoSelectionMode): string {
  switch (m) {
    case 'relation': return '关系优先';
    case 'energy':   return '能量优先';
    case 'average':
    default:         return '平均原则';
  }
}

export default function App() {
  const [view, setView] = useState<View>('main');
  const [result, setResult] = useState<HexagramResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState<HexagramInput | null>(null);
  const [editingTime, setEditingTime] = useState(false);
  const [editTimeStr, setEditTimeStr] = useState('');
  const [feedback, setFeedback] = useState('');
  const [accuracy, setAccuracy] = useState<import('./lib/historyStore').AccuracyMark | undefined>(undefined);
  const [savedToast, setSavedToast] = useState(false);

  function handleSubmit(formInput: HexagramInput) {
    setLoading(true);
    setError('');
    try {
      const ganzhi = dateToGanzhi(formInput.time);
      let yaoCodes;
      if (formInput.method === 'modern') {
        yaoCodes = modernCoin(formInput.coinsInput ?? '111111');
      } else if (formInput.method === 'ancient') {
        yaoCodes = ancientCoin(formInput.coinsInput ?? '111111');
      } else if (formInput.method === 'number') {
        yaoCodes = numberMethod(formInput.coinsInput ?? '0 0', formInput.time);
      } else if (formInput.method === 'manual') {
        yaoCodes = modernCoin(formInput.coinsInput ?? '111111');
      } else {
        yaoCodes = formInput.manualLines ?? ([1,1,1,1,1,1] as import('./types').YaoType[]);
      }
      const res = buildHexagramResult(formInput, yaoCodes, ganzhi);
      setResult(res);
      setInput(formInput);
    } catch (e) {
      setError(e instanceof Error ? e.message : '排盘出错，请检查输入后重试');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setInput(null);
    setError('');
    setEditingTime(false);
    setEditTimeStr('');
    setFeedback('');
    setAccuracy(undefined);
    setSavedToast(false);
  }

  function handleSaveRecord() {
    if (!input || !result) return;
    addEntry({
      matter: input.matter,
      category: input.category,
      time: input.time.toISOString(),
      method: input.method,
      coinsInput: input.coinsInput ?? '',
      feedback: feedback.trim(),
      accuracy,
      dongYaoMode: input.dongYaoMode ?? 'average',
      origName: result.originalHexagram.name,
      changedName: result.changedHexagram?.name,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  }

  function handleEditTime() {
    if (input) {
      setEditTimeStr(formatDatetimeLocal(input.time));
      setEditingTime(true);
    }
  }

  function handleRecalculate() {
    if (!input || !editTimeStr) return;
    const newTime = new Date(editTimeStr);
    if (isNaN(newTime.getTime())) return;
    setEditingTime(false);
    handleSubmit({ ...input, time: newTime });
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 页头 */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 4, marginBottom: 4 }}>
            ── ── ──
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--yao-red)',
            margin: 0,
            fontFamily: "'Noto Serif SC', 'Source Han Serif CN', serif",
            letterSpacing: 4,
          }}>
            六爻计分排盘
          </h1>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 0', letterSpacing: 2 }}>
            自动排盘 · 能量计分 · 吉凶判断
          </p>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: 4, marginTop: 4 }}>
            ── ── ──
          </div>
        </div>

        {/* 顶部导航 */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            type="button"
            onClick={() => {
              // 已有结果时点"起卦排盘"回到表单（等同于"重新起卦"）；否则只切 view
              if (result) handleReset();
              else setView('main');
            }}
            style={{
              fontSize: 13, padding: '6px 18px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${view === 'main' ? 'var(--gold-mid)' : 'var(--border)'}`,
              background: view === 'main' ? 'rgba(154,111,10,0.08)' : 'transparent',
              color: view === 'main' ? 'var(--gold-bright)' : 'var(--text-secondary)',
              fontWeight: view === 'main' ? 600 : 400,
            }}
          >
            起卦排盘
          </button>
          <button
            type="button"
            onClick={() => setView('history')}
            style={{
              fontSize: 13, padding: '6px 18px', borderRadius: 6, cursor: 'pointer',
              border: `1px solid ${view === 'history' ? 'var(--gold-mid)' : 'var(--border)'}`,
              background: view === 'history' ? 'rgba(154,111,10,0.08)' : 'transparent',
              color: view === 'history' ? 'var(--gold-bright)' : 'var(--text-secondary)',
              fontWeight: view === 'history' ? 600 : 400,
            }}
          >
            历史记录
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(248,81,73,0.1)',
            border: '1px solid rgba(248,81,73,0.3)',
            borderRadius: 8,
            color: 'var(--error)',
            fontSize: 13,
          }}>
            {error}
          </div>
        )}

        {view === 'history' ? (
          <HistoryView onBack={() => setView('main')} />
        ) : !result ? (
          <InputForm onSubmit={handleSubmit} loading={loading} />
        ) : (
          input && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 300ms ease-out' }}>
              {/* 事项信息（始终展示求问事项 + 类别）*/}
              <div className="card" style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11, color: 'var(--gold-mid)', fontWeight: 600,
                    padding: '2px 8px', border: '1px solid var(--gold-mid)',
                    borderRadius: 4, letterSpacing: 1, flexShrink: 0,
                  }}>
                    {input.category}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>求问事项：</span>
                  <span style={{
                    color: input.matter ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontStyle: input.matter ? 'normal' : 'italic',
                    flex: 1,
                  }}>
                    {input.matter || '（未填写）'}
                  </span>
                </div>
                {/* 高级选项摘要 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>高级选项：</span>
                  <span style={{
                    color: 'var(--yao-blue)',
                    border: '1px solid var(--yao-blue-border)',
                    background: 'var(--yao-blue-bg)',
                    borderRadius: 4, padding: '1px 6px', letterSpacing: 1, fontWeight: 500,
                  }}>
                    多动爻选取 · {dongYaoModeLabel(input.dongYaoMode)}
                  </span>
                </div>
              </div>

              {/* 起卦时间 */}
              <div className="card" style={{ fontSize: 13 }}>
                {!editingTime ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>起卦时间：</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDatetimeDisplay(input.time)}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleEditTime}
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--gold-mid)',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      修改重算
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <label style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      修改起卦时间（选完时间后点"确认"以重新排盘）
                    </label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      step="1"
                      value={editTimeStr}
                      onChange={e => setEditTimeStr(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleRecalculate}
                        disabled={loading || !editTimeStr}
                        style={{ flex: 2, fontWeight: 600 }}
                      >
                        {loading ? '排盘中…' : '✓ 确认'}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setEditingTime(false)}
                        style={{ flex: 1 }}
                      >
                        取消
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 摇卦数据 */}
              <div className="card" style={{ fontSize: 13 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>摇卦数据（{methodLabel(input.method)}）：</span>
                    <span style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'monospace',
                      fontSize: 14,
                      letterSpacing: 2,
                      marginLeft: 4,
                    }}>
                      {input.coinsInput || '—'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    style={{
                      fontSize: 12,
                      padding: '4px 10px',
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--gold-mid)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    重新起卦
                  </button>
                </div>
              </div>

              {/* 干支信息 */}
              <div className="card">
                <GanzhiBar ganzhi={result.ganzhi} tombFill={result.tombFill} />
              </div>

              {/* 卦体 */}
              <HexagramBoard result={result} />

              {/* 吉凶判断 */}
              <JudgmentPanel result={result} />

              {/* 事后反馈 */}
              <div className="card">
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  事后反馈
                </label>
                {/* 准 / 不准（单选可取消） */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <AccuracyButton
                    active={accuracy === 'accurate'}
                    onClick={() => setAccuracy(accuracy === 'accurate' ? undefined : 'accurate')}
                    label="准"
                    activeColor="var(--success)"
                  />
                  <AccuracyButton
                    active={accuracy === 'inaccurate'}
                    onClick={() => setAccuracy(accuracy === 'inaccurate' ? undefined : 'inaccurate')}
                    label="不准"
                    activeColor="var(--error)"
                  />
                </div>
                <textarea
                  className="input-field"
                  maxLength={500}
                  style={{ resize: 'vertical', minHeight: 90, width: '100%' }}
                  placeholder="记录事后发生的情况、应验或不应验之处（最多 500 字）"
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                />
                <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {feedback.length}/500
                </div>
              </div>

              {/* 底部操作：保存记录 + 重新起卦 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSaveRecord}
                  style={{ flex: 1, fontWeight: 600 }}
                >
                  {savedToast ? '✓ 已保存到历史' : '保存记录'}
                </button>
                <button type="button" className="btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
                  重新起卦
                </button>
              </div>
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AccuracyButton({ active, onClick, label, activeColor }: {
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
