import type {
  HexagramResult, ComprehensiveVerdict, DongYaoAnalysis, WangShuai,
  DongYaoSelectionMode,
} from '../types';

interface Props {
  result: HexagramResult;
}

function dongYaoModeLabel(m: DongYaoSelectionMode): string {
  switch (m) {
    case 'energy':   return '能量优先';
    case 'relation': return '关系优先';
    case 'average':
    default:         return '平均原则';
  }
}

function wangShuaiTextCN(ws: WangShuai): string {
  return ws === '旺' ? '旺相' : ws === '衰' ? '衰败' : '平相';
}

function wangShuaiColor(ws: WangShuai): string {
  if (ws === '旺') return 'var(--success)';
  if (ws === '衰') return 'var(--error)';
  return 'var(--text-muted)';
}

function WangShuaiBadge({ ws }: { ws: WangShuai }) {
  const color = wangShuaiColor(ws);
  return (
    <span style={{
      fontSize: 11,
      color,
      fontWeight: 600,
      padding: '1px 6px',
      border: `1px solid ${color}`,
      borderRadius: 4,
      letterSpacing: 1,
      lineHeight: 1.4,
    }}>
      {wangShuaiTextCN(ws)}
    </span>
  );
}

// 动爻分析子模块内容
function DongYaoAnalysisBlock({ analysis }: { analysis: DongYaoAnalysis }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.75,
      }}>
        {analysis.description}
      </div>

      {/* single */}
      {analysis.reason === 'single' && analysis.singleBranch && analysis.singleWangShuai && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>重点爻</span>
            <span style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 600 }}>
              第{analysis.singlePosition}爻 {analysis.singleBranch}
            </span>
            <WangShuaiBadge ws={analysis.singleWangShuai} />
          </div>
          {analysis.singleReason && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {analysis.singleReason}
            </div>
          )}
        </div>
      )}

      {/* sanhe */}
      {analysis.reason === 'sanhe' && analysis.sanHeZhongShenBranch && analysis.sanHeZhongShenWangShuai && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--yao-blue-border)',
          background: 'var(--yao-blue-bg)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>三合{analysis.sanHeElement}局 · 中神</span>
            <span style={{ fontSize: 13, color: 'var(--yao-blue)', fontWeight: 600 }}>
              {analysis.sanHeZhongShenPosition ? `第${analysis.sanHeZhongShenPosition}爻 ` : ''}
              {analysis.sanHeZhongShenBranch}
            </span>
            <WangShuaiBadge ws={analysis.sanHeZhongShenWangShuai} />
          </div>
          {analysis.sanHeZhongShenReason && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              {analysis.sanHeZhongShenReason}
            </div>
          )}
        </div>
      )}

      {/* shengChain：按终点分组，同终点的多条链一并展示，旺衰只显示一次 */}
      {analysis.reason === 'shengChain' && analysis.shengChains?.map((group, gi) => (
        <div key={gi} style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(154,111,10,0.05)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {group.chains.length > 1 ? '相生链（多条共享终点）' : '相生链'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {group.chains.map((chain, ci) => (
              <div key={ci} style={{ fontSize: 13, color: 'var(--text-primary)', letterSpacing: 1 }}>
                {group.chains.length > 1 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 6 }}>
                    #{ci + 1}
                  </span>
                )}
                {chain.branches.map((b, j) => (
                  <span key={j}>
                    <span style={{
                      color: j === chain.branches.length - 1 ? 'var(--gold-bright)' : 'var(--text-secondary)',
                      fontWeight: j === chain.branches.length - 1 ? 600 : 400,
                    }}>
                      {b}
                    </span>
                    {j < chain.branches.length - 1 && (
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                    )}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>终点</span>
            <span style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 600 }}>
              第{group.terminalPosition}爻 {group.terminalBranch}
            </span>
            <WangShuaiBadge ws={group.terminalWangShuai} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {group.terminalReason}
          </div>
        </div>
      ))}

      {/* shengCycle（相生闭环） */}
      {analysis.reason === 'shengCycle' && analysis.shengCycle && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(154,111,10,0.05)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>相生闭环</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', letterSpacing: 1, fontWeight: 500 }}>
            {analysis.shengCycle.elementChain.map((e, i) => (
              <span key={i}>
                <span style={{ color: 'var(--gold-bright)' }}>{e}</span>
                {i < analysis.shengCycle!.elementChain.length - 1 && (
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>
                )}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            参与动爻：
            {analysis.shengCycle.participants.map((p, i) => (
              <span key={i}>
                {i > 0 && '、'}
                <span style={{ color: 'var(--text-secondary)' }}>第{p.position}爻 {p.branch}</span>
              </span>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            具体生克影响见下方「动爻影响」。
          </div>
        </div>
      )}

      {/* separate */}
      {analysis.reason === 'separate' && analysis.separatePositions && (
        <div style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
          fontSize: 12,
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          涉及爻位：{analysis.separatePositions.map(p => `第${p}爻`).join('、')}；具体生克影响见下方「动爻影响」。
        </div>
      )}

      {/* energy 优先 */}
      {analysis.reason === 'energy' && analysis.energyFocus?.map((y, i) => (
        <div key={i} style={{
          padding: '8px 10px',
          borderRadius: 6,
          border: '1px solid var(--border)',
          background: 'rgba(154,111,10,0.05)',
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              重点爻 {analysis.energyFocus!.length > 1 ? `#${i + 1}` : ''}
            </span>
            <span style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 600 }}>
              第{y.position}爻 {y.branch}
            </span>
            <span style={{
              fontSize: 11, color: 'var(--text-secondary)',
              padding: '1px 6px', borderRadius: 4,
              border: '1px solid var(--border)',
              letterSpacing: 1,
            }}>
              {y.level}
            </span>
            <WangShuaiBadge ws={y.wangShuai} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            先天能量 {y.energyScore > 0 ? '+' : ''}{y.energyScore}；{y.reason}
          </div>
        </div>
      ))}

      {/* relation 优先 */}
      {analysis.reason === 'relation' && analysis.relationFocus && (() => {
        const rf = analysis.relationFocus;
        const items: { label: '世爻' | '用神' | '世爻/用神'; entry?: typeof rf.forWorld; empty?: string }[] = [];
        if (rf.isYongChiShi) {
          items.push({ label: '世爻/用神', entry: rf.forWorld, empty: rf.worldEmpty });
        } else {
          items.push({ label: '用神', entry: rf.forYong, empty: rf.yongEmpty });
          items.push({ label: '世爻', entry: rf.forWorld, empty: rf.worldEmpty });
        }
        return items.map((it, i) => (
          <div key={i} style={{
            padding: '8px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'rgba(154,111,10,0.05)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {it.entry ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 11,
                    color: it.label === '世爻' ? 'var(--yao-blue)' : 'var(--gold-mid)',
                    fontWeight: 600,
                    padding: '1px 6px',
                    border: `1px solid ${it.label === '世爻' ? 'var(--yao-blue)' : 'var(--gold-mid)'}`,
                    borderRadius: 4,
                    letterSpacing: 1,
                  }}>
                    {it.label}
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--gold-bright)', fontWeight: 600 }}>
                    第{it.entry.position}爻 {it.entry.branch}
                  </span>
                  <span style={{
                    fontSize: 11, color: 'var(--text-secondary)',
                    padding: '1px 6px', borderRadius: 4,
                    border: '1px solid var(--border)',
                    letterSpacing: 1,
                  }}>
                    {it.entry.relation}
                  </span>
                  <WangShuaiBadge ws={it.entry.wangShuai} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  能量级别 {it.entry.level}，先天能量 {it.entry.energyScore > 0 ? '+' : ''}{it.entry.energyScore}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  color: it.label === '世爻' ? 'var(--yao-blue)' : 'var(--gold-mid)',
                  fontWeight: 600,
                  padding: '1px 6px',
                  border: `1px solid ${it.label === '世爻' ? 'var(--yao-blue)' : 'var(--gold-mid)'}`,
                  borderRadius: 4,
                  letterSpacing: 1,
                }}>
                  {it.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {it.empty || '未找到关系动爻'}
                </span>
              </div>
            )}
          </div>
        ));
      })()}
    </div>
  );
}

// 6 级吉凶定性 → 配色
function comprehensiveColor(v: ComprehensiveVerdict): string {
  switch (v) {
    case '大吉': return 'var(--success)';
    case '小吉':
    case '平吉': return 'var(--gold-mid)';
    case '平':   return 'var(--text-muted)';
    case '平凶':
    case '小凶': return 'var(--warning)';
    case '大凶':
    case '凶':   return 'var(--error)';
  }
}

export function JudgmentPanel({ result }: Props) {
  const { judgment, yongShen, sanHe, dongYaoAnalysis } = result;
  const {
    preTianYong, preTianWorld, dongYaoYong, dongYaoWorld, isYongChiShi,
    worldYongRelation, comprehensive,
  } = judgment;

  // 顶部徽章用 6 级定性
  const verdictColor = comprehensiveColor(comprehensive.verdict);
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
            fontSize: 20,
            fontWeight: 700,
            color: verdictColor,
            padding: '3px 14px',
            border: `1.5px solid ${verdictColor}`,
            borderRadius: 8,
            letterSpacing: 2,
          }}
        >
          {comprehensive.verdict}
        </span>
      </div>

      {/* 用神信息 */}
      {yongShen && (
        <div style={{
          padding: '6px 10px',
          background: 'rgba(154,111,10,0.06)',
          borderRadius: 6, border: '1px solid rgba(154,111,10,0.18)',
          fontSize: 12, color: 'var(--gold-mid)',
        }}>
          用神：{yongShen.relative}（{yongShen.yaoBranch}
          {yongShen.isFuShenView
            ? `，伏在第${yongShen.position}爻下`
            : `，第${yongShen.position}爻`}
          ）
          {/* 伏神不占飞神的世应位，故仅在非伏神视图下标注世/应 */}
          {!yongShen.isFuShenView && yongShen.isWorldLine && '·世爻'}
          {!yongShen.isFuShenView && yongShen.isResponseLine && '·应爻'}
        </div>
      )}

      {/* 三合局提示 */}
      {sanHe && (
        <div style={{
          padding: '6px 10px',
          background: 'var(--yao-blue-bg)',
          borderRadius: 6, border: '1px solid var(--yao-blue-border)',
          fontSize: 12, color: 'var(--yao-blue)',
        }}>
          存在三合{sanHe.element}局，中神：{sanHe.zhongShen}
        </div>
      )}

      {/* 三大段判断；持世时合并为一行，标签"世爻/用神" */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <JudgmentSection title="先天能量">
          {isYongChiShi ? (
            <JudgmentSub label="世爻/用神" text={preTianWorld} />
          ) : (
            <>
              <JudgmentSub label="用神" text={preTianYong} />
              <JudgmentSub label="世爻" text={preTianWorld} />
            </>
          )}
        </JudgmentSection>
        {dongYaoAnalysis.reason !== 'none-active' && (
          <JudgmentSection title={`动爻分析（${dongYaoModeLabel(dongYaoAnalysis.mode)}）`}>
            <DongYaoAnalysisBlock analysis={dongYaoAnalysis} />
          </JudgmentSection>
        )}
        <JudgmentSection title="动爻影响">
          {isYongChiShi ? (
            <JudgmentSub label="世爻/用神" text={dongYaoWorld} />
          ) : (
            <>
              <JudgmentSub label="用神" text={dongYaoYong} />
              <JudgmentSub label="世爻" text={dongYaoWorld} />
            </>
          )}
        </JudgmentSection>
        <JudgmentSection title="世用关系">
          {worldYongRelation.type ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                本卦属于「
                <span style={{ color: 'var(--gold-bright)' }}>{worldYongRelation.type}</span>
                」
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--text-muted)' }}>含义：</span>
                {worldYongRelation.meaning}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--text-muted)' }}>吉凶本质：</span>
                {worldYongRelation.essence}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {worldYongRelation.essence || '—'}
            </div>
          )}
        </JudgmentSection>

        <JudgmentSection title="综合判断" accent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{
              fontSize: 13, color: 'var(--text-primary)',
              lineHeight: 1.7, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            }}>
              <span>{comprehensive.statusLine}</span>
              <span style={{
                fontSize: 13, fontWeight: 700,
                color: verdictColor,
                padding: '2px 10px',
                background: 'transparent',
                border: `1.3px solid ${verdictColor}`,
                borderRadius: 6,
                letterSpacing: 1,
              }}>
                {comprehensive.verdict}
              </span>
            </div>
            <div style={{
              fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.75,
            }}>
              {comprehensive.explanation}
            </div>
          </div>
        </JudgmentSection>
      </div>
    </div>
  );
}

function JudgmentSection({ title, accent, children }: {
  title: string; accent?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <div style={{
        fontSize: 11,
        color: accent ? 'var(--gold-mid)' : 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        fontWeight: accent ? 600 : 500,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );
}

// 用神 / 世爻 / 世爻/用神 子段：左侧色块前缀 + 内容
function JudgmentSub({ label, text }: { label: '用神' | '世爻' | '世爻/用神'; text: string }) {
  // 持世时用金色（强调），分开时用神金色、世爻青蓝
  const accent = label === '用神' || label === '世爻/用神' ? 'var(--gold-mid)' : 'var(--yao-blue)';
  // 内容文字会以 "用神：..." / "世爻：..." / "世爻/用神：..." 起首，前缀避免双重显示
  const body = text.replace(/^(世爻\/用神|用神|世爻)[:：]\s*/, '');
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0,
        fontSize: 11,
        color: accent,
        fontWeight: 600,
        padding: '2px 6px',
        border: `1px solid ${accent}`,
        borderRadius: 4,
        lineHeight: 1.3,
        marginTop: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        color: 'var(--text-secondary)',
        lineHeight: 1.7,
        flex: 1,
      }}>
        {body}
      </span>
    </div>
  );
}
