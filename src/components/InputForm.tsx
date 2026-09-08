import { useState } from 'react';
import { CATEGORY_TIPS } from '../data/constants';
import type {
  Category, DivinationMethod, HexagramInput, DongYaoSelectionMode,
} from '../types';

const DONGYAO_MODES: { value: DongYaoSelectionMode; label: string; tip: string; disabled?: boolean }[] = [
  {
    value: 'average',
    label: '平均原则',
    tip: '依次按 三合局 → 动动相生 → 分别分析 选取重点动爻。',
  },
  {
    value: 'relation',
    label: '关系优先',
    tip: '多动爻无三合无相生时，按动爻与世/用神的 六合 > 相冲 > 被生 > 被克 > 主生 > 主克 关系等级选取（同级看能量）。',
  },
  {
    value: 'energy',
    label: '能量优先',
    tip: '多动爻无三合无相生时，按 化旺 > 平动 > 化废 + 同级先天能量数值排序，最高级 ≥2 且能量为正时取前两名同时分析。',
  },
];

interface Props {
  onSubmit: (input: HexagramInput) => void;
  loading: boolean;
}

const CATEGORIES: Category[] = ['妻财', '官鬼', '父母', '子孙', '兄弟'];
const METHODS: { value: DivinationMethod; label: string; tip: string }[] = [
  {
    value: 'modern',
    label: '现代硬币摇卦',
    tip: '以币面数字为阳，国徽为阴。输入六次摇卦中数字向上的次数（如123023），每位0-3。0=老阴,1=少阳,2=少阴,3=老阳',
  },
  {
    value: 'ancient',
    label: '古代钱币摇卦',
    tip: '以古币背面为阳，字面为阴。输入六次摇卦中字面向上的次数（如123023），每位0-3。0=老阳,1=少阴,2=少阳,3=老阴',
  },
  {
    value: 'number',
    label: '起数法',
    tip: '输入两个任意整数，以空格分隔（如"25 7"）。第一个数 % 8 定下卦，第二个数 % 6 定上卦，当前时间分钟数定动爻。',
  },
  {
    value: 'manual',
    label: '手动输入',
    tip: '直接输入爻型（0=老阴,1=少阳,2=少阴,3=老阳），从一爻到六爻，每位0-3。',
  },
];

function nowDatetimeLocal(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

export function InputForm({ onSubmit, loading }: Props) {
  const [matter, setMatter] = useState('');
  const [category, setCategory] = useState<Category | ''>('');
  const [timeStr, setTimeStr] = useState(nowDatetimeLocal());
  const [method, setMethod] = useState<DivinationMethod>('modern');
  const [coinsInput, setCoinsInput] = useState('');
  const [error, setError] = useState('');
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dongYaoMode, setDongYaoMode] = useState<DongYaoSelectionMode>('average');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) { setError('请选择事项类别'); return; }
    if (!timeStr) { setError('请选择起卦时间'); return; }
    if ((method === 'modern' || method === 'ancient' || method === 'manual') && !/^[0-3]{6}$/.test(coinsInput)) {
      setError('请输入6位数字，每位0-3'); return;
    }
    if (method === 'number' && !/^\d+\s+\d+$/.test(coinsInput.trim())) {
      setError('请输入两个整数，以空格分隔，例如：25 7'); return;
    }
    setError('');
    onSubmit({
      matter: matter.trim(),
      category: category as Category,
      time: new Date(timeStr),
      method,
      coinsInput,
      dongYaoMode,
    });
  }

  function handleCoinsInput(val: string) {
    if (method === 'number') {
      // 只允许数字和空格
      const filtered = val.replace(/[^0-9 ]/g, '');
      setCoinsInput(filtered);
    } else {
      // 只允许0-3的数字，最多6位
      const filtered = val.replace(/[^0-3]/g, '').slice(0, 6);
      setCoinsInput(filtered);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 咨询事项 */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>
          咨询事项（选填）
        </label>
        <textarea
          className="input-field"
          style={{ resize: 'vertical', minHeight: 60 }}
          placeholder="请简述您想咨询的事项..."
          maxLength={250}
          value={matter}
          onChange={e => setMatter(e.target.value)}
        />
        {matter.length > 0 && (
          <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            {matter.length}/250
          </div>
        )}
      </div>

      {/* 事项类别 */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
          事项类别 <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map(cat => (
            <div key={cat} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                className={`category-btn${category === cat ? ' selected' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
              <span
                style={{ cursor: 'help', color: 'var(--text-muted)', fontSize: 11, position: 'relative' }}
                onMouseEnter={() => setActiveTooltip(cat)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                ⓘ
                {activeTooltip === cat && (
                  <span style={{
                    position: 'absolute',
                    bottom: '120%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1A1F26',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '8px 12px',
                    minWidth: 220,
                    maxWidth: 300,
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 50,
                    whiteSpace: 'pre-wrap',
                    pointerEvents: 'none',
                  }}>
                    {CATEGORY_TIPS[cat]}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 起卦时间 */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>
          起卦时间 <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <input
          type="datetime-local"
          className="input-field"
          step="1"
          value={timeStr}
          onChange={e => setTimeStr(e.target.value)}
        />
      </div>

      {/* 起卦方式 */}
      <div>
        <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8 }}>
          起卦方式
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {METHODS.map(m => (
            <label
              key={m.value}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${method === m.value ? 'var(--gold-mid)' : 'var(--border)'}`,
                background: method === m.value ? 'rgba(212,160,23,0.08)' : 'transparent',
                transition: 'all 150ms',
              }}
            >
              <input
                type="radio"
                name="method"
                value={m.value}
                checked={method === m.value}
                onChange={() => { setMethod(m.value); setCoinsInput(''); }}
                style={{ marginTop: 2, accentColor: 'var(--gold-mid)' }}
              />
              <div>
                <div style={{ color: method === m.value ? 'var(--gold-bright)' : 'var(--text-primary)', fontSize: 13, fontWeight: 500 }}>
                  {m.label}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>
                  {m.tip}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 摇卦输入 / 手动输入 */}
      {(method === 'modern' || method === 'ancient' || method === 'manual') && (
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>
            {method === 'manual'
              ? '爻型数据（6位，从一爻到六爻，0=老阴,1=少阳,2=少阴,3=老阳）'
              : '摇卦数据（6位，从一爻到六爻，每位0-3）'}
            <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="例如：123023"
            value={coinsInput}
            onChange={e => handleCoinsInput(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            style={{ letterSpacing: 6, fontSize: 18, fontFamily: 'monospace', textAlign: 'center' }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4, justifyContent: 'center' }}>
            {Array.from({length: 6}).map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  width: 28,
                  textAlign: 'center',
                }}
              >
                {i+1}爻
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 起数法输入 */}
      {method === 'number' && (
        <div>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginBottom: 6 }}>
            输入两个整数（以空格分隔）<span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="例如：25 7"
            value={coinsInput}
            onChange={e => handleCoinsInput(e.target.value)}
            inputMode="numeric"
            style={{ fontSize: 18, fontFamily: 'monospace', textAlign: 'center' }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, textAlign: 'center' }}>
            第一个数 % 8 = 下卦，第二个数 % 6 = 上卦，当前分钟定动爻
          </div>
        </div>
      )}

      {/* 高级设置（折叠） */}
      <div style={{
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <button
          type="button"
          onClick={() => setAdvancedOpen(v => !v)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          <span>高级设置</span>
          <span style={{
            color: 'var(--text-muted)',
            fontSize: 11,
            transform: advancedOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 150ms',
          }}>▾</span>
        </button>
        {advancedOpen && (
          <div style={{
            padding: '4px 12px 12px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 12, marginTop: 8, marginBottom: 6 }}>
                多动爻选取
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DONGYAO_MODES.map(m => (
                  <label
                    key={m.value}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      cursor: m.disabled ? 'not-allowed' : 'pointer',
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: `1px solid ${dongYaoMode === m.value ? 'var(--gold-mid)' : 'var(--border)'}`,
                      background: dongYaoMode === m.value ? 'rgba(212,160,23,0.08)' : 'transparent',
                      opacity: m.disabled ? 0.45 : 1,
                      transition: 'all 150ms',
                    }}
                  >
                    <input
                      type="radio"
                      name="dongYaoMode"
                      value={m.value}
                      checked={dongYaoMode === m.value}
                      disabled={m.disabled}
                      onChange={() => !m.disabled && setDongYaoMode(m.value)}
                      style={{ marginTop: 2, accentColor: 'var(--gold-mid)' }}
                    />
                    <div>
                      <div style={{
                        color: dongYaoMode === m.value ? 'var(--gold-bright)' : 'var(--text-primary)',
                        fontSize: 13,
                        fontWeight: 500,
                      }}>
                        {m.label}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>
                        {m.tip}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ color: 'var(--error)', fontSize: 13, padding: '8px 12px', background: 'rgba(248,81,73,0.1)', borderRadius: 6 }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '排盘中...' : '起卦 · 排盘'}
      </button>
    </form>
  );
}
