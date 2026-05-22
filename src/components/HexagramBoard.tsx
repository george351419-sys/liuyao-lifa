import { useState } from 'react';
import type { HexagramResult } from '../types';
import { YaoRow } from './YaoRow';

interface Props {
  result: HexagramResult;
}

export function HexagramBoard({ result }: Props) {
  const { originalHexagram, changedHexagram, yaos, yongShen } = result;
  const [showOrigDesc, setShowOrigDesc] = useState(false);
  const [showChangedDesc, setShowChangedDesc] = useState(false);

  // 爻从六爻到一爻（从上到下显示）
  const reversedYaos = [...yaos].reverse();

  return (
    <div className="card-gold-top" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* 卦名行 */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold-bright)', fontFamily: 'serif' }}>
            {originalHexagram.name}
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
            {originalHexagram.upperTrigram}上{originalHexagram.lowerTrigram}下
          </span>
        </div>
        {changedHexagram && (
          <>
            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>→</span>
            <div>
              <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--gold-bright)', fontFamily: 'serif' }}>
                {changedHexagram.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                {changedHexagram.upperTrigram}上{changedHexagram.lowerTrigram}下
              </span>
            </div>
          </>
        )}
      </div>

      {/* 表头 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px 44px 1fr 30px 60px',
          gap: 6,
          fontSize: 10,
          color: 'var(--text-muted)',
          padding: '0 4px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: 6,
        }}
      >
        <span style={{ textAlign: 'center' }}>六神</span>
        <span style={{ textAlign: 'center' }}>六亲</span>
        <span style={{ textAlign: 'center' }}>本卦</span>
        <span style={{ textAlign: 'center' }}>世应</span>
        <span style={{ textAlign: 'right' }}>变爻</span>
      </div>

      {/* 六爻行（从六爻到一爻） */}
      {reversedYaos.map(yao => (
        <YaoRow
          key={yao.position}
          yao={yao}
          isYongShen={yongShen?.position === yao.position}
        />
      ))}

      {/* 卦义展开 */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
          onClick={() => setShowOrigDesc(v => !v)}
        >
          <span>本卦卦义：{originalHexagram.name}</span>
          <span>{showOrigDesc ? '▲' : '▼'}</span>
        </button>
        {showOrigDesc && (
          <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-elevated)', borderRadius: 8 }}>
            {originalHexagram.description}
          </div>
        )}

        {changedHexagram && (
          <>
            <button
              type="button"
              className="btn-secondary"
              style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
              onClick={() => setShowChangedDesc(v => !v)}
            >
              <span>变卦卦义：{changedHexagram.name}</span>
              <span>{showChangedDesc ? '▲' : '▼'}</span>
            </button>
            {showChangedDesc && (
              <div style={{ padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                {changedHexagram.description}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
