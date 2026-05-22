import type { HexagramResult } from '../types';

interface Props {
  result: HexagramResult;
}

export function JudgmentPanel({ result }: Props) {
  const { judgment, yongShen, sanHe } = result;
  const { verdict, preTianStatus, dongYaoRelation, worldYongRelation } = judgment;

  const verdictColor = verdict === '吉' ? 'var(--success)' : verdict === '凶' ? 'var(--error)' : 'var(--warning)';
  const leftBorderColor = verdictColor;

  return (
    <div
      className="card"
      style={{
        borderLeft: `3px solid ${leftBorderColor}`,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>吉凶分析</span>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: verdictColor,
            padding: '2px 12px',
            border: `1px solid ${verdictColor}`,
            borderRadius: 8,
          }}
        >
          {verdict}
        </span>
      </div>

      {/* 用神信息 */}
      {yongShen && (
        <div style={{
          padding: '6px 10px',
          background: 'rgba(212,160,23,0.06)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--gold-bright)',
        }}>
          用神：{yongShen.relative}（{yongShen.yaoBranch}，第{yongShen.position}爻）
          {yongShen.isWorldLine && '·世爻'}
          {yongShen.isResponseLine && '·应爻'}
        </div>
      )}

      {/* 三合局提示 */}
      {sanHe && (
        <div style={{
          padding: '6px 10px',
          background: 'rgba(96,165,250,0.08)',
          borderRadius: 6,
          fontSize: 12,
          color: 'var(--yao-blue)',
        }}>
          存在三合{sanHe.element}局，中神：{sanHe.zhongShen}
        </div>
      )}

      {/* 三段判断 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <JudgmentSection title="先天能量" content={preTianStatus} />
        <JudgmentSection title="动爻影响" content={dongYaoRelation} />
        <JudgmentSection title="世用关系" content={worldYongRelation} accent />
      </div>
    </div>
  );
}

function JudgmentSection({ title, content, accent }: { title: string; content: string; accent?: boolean }) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 13,
        color: accent ? 'var(--text-primary)' : 'var(--text-secondary)',
        lineHeight: 1.7,
        fontWeight: accent ? 500 : 400,
      }}>
        {content}
      </div>
    </div>
  );
}
