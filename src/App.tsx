import { useState } from 'react';
import './index.css';
import type { HexagramInput, HexagramResult } from './types';
import { dateToGanzhi } from './lib/ganzhi';
import { modernCoin, ancientCoin } from './lib/divination';
import { buildHexagramResult } from './lib/hexagram';
import { InputForm } from './components/InputForm';
import { GanzhiBar } from './components/GanzhiBar';
import { HexagramBoard } from './components/HexagramBoard';
import { JudgmentPanel } from './components/JudgmentPanel';

export default function App() {
  const [result, setResult] = useState<HexagramResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [input, setInput] = useState<HexagramInput | null>(null);

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
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* 页头 */}
        <div style={{ textAlign: 'center', paddingBottom: 4 }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--gold-bright)',
            margin: 0,
            fontFamily: 'serif',
            letterSpacing: 2,
          }}>
            六爻计分法排盘
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            自动排盘 · 能量计分 · 吉凶判断
          </p>
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

        {!result ? (
          <InputForm onSubmit={handleSubmit} loading={loading} />
        ) : (
          input && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 300ms ease-out' }}>
              {/* 事项信息 */}
              {input.matter && (
                <div className="card" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>咨询事项：</span>
                  {input.matter}
                  <span style={{ marginLeft: 12, color: 'var(--gold-mid)', fontSize: 12 }}>
                    [{input.category}]
                  </span>
                </div>
              )}

              {/* 干支信息 */}
              <div className="card">
                <GanzhiBar ganzhi={result.ganzhi} />
              </div>

              {/* 卦体 */}
              <HexagramBoard result={result} />

              {/* 吉凶判断 */}
              <JudgmentPanel result={result} />

              {/* 重新起卦 */}
              <button type="button" className="btn-secondary" onClick={handleReset} style={{ marginTop: 4 }}>
                重新起卦
              </button>
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
