import { useState } from 'react';
import type { HexagramResult } from '../types';
import { YaoRow, COL } from './YaoRow';
import { getHexagramAttributes, getBenBianRelations } from '../data/hexagrams';

interface Props { result: HexagramResult; }

export function HexagramBoard({ result }: Props) {
  const { originalHexagram, changedHexagram, yaos, yongShen } = result;
  const [showOrigDesc,    setShowOrigDesc]    = useState(false);
  const [showChangedDesc, setShowChangedDesc] = useState(false);
  const [showLegend,      setShowLegend]      = useState(false);
  const hasChanged = !!changedHexagram;
  const reversedYaos = [...yaos].reverse();

  const headerStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: COL,
    gap: 3,
    alignItems: 'baseline',
    fontSize: 12,
    fontWeight: 700,
    fontFamily: "'Noto Serif SC', serif",
    letterSpacing: 1,
  };

  return (
    <div className="card-red-top" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── 双卦名标题 ── */}
      {(() => {
        const origAttrs = getHexagramAttributes(originalHexagram.name);
        const changedAttrs = hasChanged ? getHexagramAttributes(changedHexagram!.name) : [];
        const benBianRels = hasChanged
          ? getBenBianRelations(originalHexagram.lines, changedHexagram!.lines)
          : [];

        // 标签按性质上色：六合=绿、六冲=红、其他=金色
        const tagColor = (tag: string) => {
          if (tag === '六合卦') return 'var(--success)';
          if (tag === '六冲卦') return 'var(--yao-red)';
          return 'var(--gold-mid)';
        };

        return (
          <>
            <div style={headerStyle}>
              <span />
              <span style={{ gridColumn: '2 / 7', color: 'var(--yao-red)', fontSize: 14 }}>
                {originalHexagram.name}
                {origAttrs.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, fontFamily: 'sans-serif',
                    marginLeft: 4, letterSpacing: 0, color: tagColor(tag),
                  }}>
                    （{tag}）
                  </span>
                ))}
                <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'sans-serif', marginLeft: 5, letterSpacing: 0 }}>
                  {originalHexagram.upperTrigram}上{originalHexagram.lowerTrigram}下
                </span>
              </span>
              <span />
              <span style={{ gridColumn: '8 / 11', color: hasChanged ? 'var(--yao-blue)' : 'var(--text-muted)', fontSize: 14 }}>
                {hasChanged ? changedHexagram!.name : '—'}
                {hasChanged && changedAttrs.map(tag => (
                  <span key={tag} style={{
                    fontSize: 10, fontWeight: 600, fontFamily: 'sans-serif',
                    marginLeft: 4, letterSpacing: 0, color: tagColor(tag),
                  }}>
                    （{tag}）
                  </span>
                ))}
                {hasChanged && (
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'sans-serif', marginLeft: 5, letterSpacing: 0 }}>
                    {changedHexagram!.upperTrigram}上{changedHexagram!.lowerTrigram}下
                  </span>
                )}
              </span>
            </div>

            {/* 本卦与变卦的关系 */}
            {benBianRels.length > 0 && (
              <div style={{
                fontSize: 11, color: 'var(--gold-mid)',
                padding: '2px 0 4px 14px',
                letterSpacing: 1,
              }}>
                本卦 ↔ 变卦：{benBianRels.map(r => `${r}关系`).join(' · ')}
              </div>
            )}
          </>
        );
      })()}

      {/* ── 列标题 ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: COL, gap: 3,
        fontSize: 9, color: 'var(--text-muted)',
        padding: '4px 0 6px',
        borderBottom: '1px solid var(--border-soft)',
        marginBottom: 2,
      }}>
        <span style={{ textAlign: 'center' }}>世应</span>
        <span style={{ textAlign: 'center' }}>六神</span>
        <span style={{ textAlign: 'right', paddingRight: 2 }}>六亲</span>
        <span style={{ textAlign: 'left', paddingLeft: 24 }}>地支</span>
        <span style={{ textAlign: 'center' }}>本卦</span>
        <span style={{ textAlign: 'center' }}>动</span>
        <span />
        <span style={{ textAlign: 'center' }}>变卦</span>
        <span style={{ textAlign: 'left', paddingLeft: 2 }}>六亲</span>
        <span style={{ textAlign: 'left', paddingLeft: 2 }}>地支</span>
      </div>

      {/* ── 六爻行（六→一，从上到下） ── */}
      {reversedYaos.map(yao => (
        <YaoRow
          key={yao.position}
          yao={yao}
          isYongShen={yongShen?.position === yao.position}
          showChangedLine={hasChanged}
        />
      ))}

      {/* ── 折叠区：符号说明 + 卦义 ── */}
      <div style={{ borderTop: '1px solid var(--border-soft)', marginTop: 6, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <LegendCollapseRow
          open={showLegend}
          onToggle={() => setShowLegend(v => !v)}
        />
        <CollapseRow
          title={`${originalHexagram.name} · 卦义`}
          content={originalHexagram.description}
          open={showOrigDesc}
          onToggle={() => setShowOrigDesc(v => !v)}
          color="var(--yao-red)"
        />
        {hasChanged && (
          <CollapseRow
            title={`${changedHexagram!.name} · 卦义`}
            content={changedHexagram!.description}
            open={showChangedDesc}
            onToggle={() => setShowChangedDesc(v => !v)}
            color="var(--yao-blue)"
          />
        )}
      </div>
    </div>
  );
}

// ── 符号说明（可折叠）：与卦义折叠样式保持一致 ──────────────
function LegendCollapseRow({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 11,
    color: 'var(--text-secondary)',
    lineHeight: 1.4,
  };
  const color = 'var(--gold-mid)';
  return (
    <>
      <button type="button" onClick={onToggle} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '3px 0', width: '100%',
      }}>
        <span style={{ fontSize: 12, color, fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>
          符号说明
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          padding: '10px 14px',
          background: 'var(--bg-elevated)',
          borderRadius: 6,
          borderLeft: `2px solid ${color}`,
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 14px',
        }}>
          <div style={itemStyle}>
            <span style={{ color: 'var(--yao-blue)', fontWeight: 500, fontSize: 12 }}>空</span>
            <span>蓝色「空」：月建旬空</span>
          </div>
          <div style={itemStyle}>
            <span style={{ color: 'var(--yao-orange)', fontWeight: 500, fontSize: 12 }}>空</span>
            <span>橙色「空」：日辰旬空</span>
          </div>
          <div style={itemStyle}>
            <DashedCircle />
            <span>空心虚线圆：暗动</span>
          </div>
          <div style={itemStyle}>
            <DashedBox>戌</DashedBox>
            <span>虚线方框：入墓</span>
          </div>
          <div style={itemStyle}>
            <span style={{ fontStyle: 'italic', color: 'var(--yao-blue)', fontWeight: 500 }}>戌土</span>
            <span>蓝色斜体：月破</span>
          </div>
          <div style={itemStyle}>
            <span style={{ fontStyle: 'italic', color: 'var(--yao-orange)', fontWeight: 500 }}>戌土</span>
            <span>橙色斜体：日破</span>
          </div>
          <div style={itemStyle}>
            <span className="fanyin-line" style={{ color: 'var(--text-secondary)' }}>戌土</span>
            <span>变爻下虚线：反吟</span>
          </div>
          <div style={itemStyle}>
            <span className="fuyin-line" style={{ color: 'var(--text-secondary)' }}>戌土</span>
            <span>变爻下实线：伏吟</span>
          </div>
        </div>
      )}
    </>
  );
}

function DashedCircle() {
  return (
    <span style={{
      display: 'inline-block',
      width: 11, height: 11,
      borderRadius: '50%',
      border: '1.3px dashed var(--yao-orange)',
      flexShrink: 0,
      boxSizing: 'border-box',
    }} />
  );
}

function DashedBox({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      outline: '1.3px dashed var(--yao-orange-border)',
      borderRadius: 2,
      padding: '0 2px',
      fontSize: 11,
      color: 'var(--yao-orange)',
      background: 'var(--yao-orange-bg)',
    }}>
      {children}
    </span>
  );
}

function CollapseRow({ title, content, open, onToggle, color }: {
  title: string; content: string; open: boolean; onToggle: () => void; color: string;
}) {
  return (
    <>
      <button type="button" onClick={onToggle} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '3px 0', width: '100%',
      }}>
        <span style={{ fontSize: 12, color, fontFamily: "'Noto Serif SC', serif", fontWeight: 600 }}>{title}</span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.85,
          padding: '10px 14px', background: 'var(--bg-elevated)',
          borderRadius: 6, borderLeft: `2px solid ${color}`,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {content}
        </div>
      )}
    </>
  );
}
