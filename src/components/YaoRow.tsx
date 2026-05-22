import type { YaoState } from '../types';
import { BRANCH_LABEL } from '../data/constants';

interface Props {
  yao: YaoState;
  isYongShen: boolean;
}

// 爻文字显示（考虑旬空、月破、日破颜色）
function YaoBranchText({ yao }: { yao: YaoState }) {
  const label = BRANCH_LABEL[yao.yaoBranch] ?? yao.yaoBranch;
  let color = 'var(--text-primary)';
  let isItalic = false;
  let withParens = false;

  // 月建旬空：蓝色+括号
  if (yao.isMonthXunKong) { color = 'var(--yao-blue)'; withParens = true; }
  // 日辰旬空：橙色+括号（优先月建）
  else if (yao.isDayXunKong) { color = 'var(--yao-orange)'; withParens = true; }
  // 月破：蓝色斜体
  else if (yao.isMonthPo) { color = 'var(--yao-blue)'; isItalic = true; }
  // 日破：橙色斜体
  else if (yao.isDayPo) { color = 'var(--yao-orange)'; isItalic = true; }

  // 入墓底色
  let bg = 'transparent';
  if (yao.tombType === 'month') bg = 'var(--yao-blue-bg)';
  else if (yao.tombType === 'day') bg = 'var(--yao-orange-bg)';
  else if (yao.tombType === 'dong') bg = 'var(--yao-yellow-bg)';
  else if (yao.tombType === 'hua') bg = 'rgba(167,139,250,0.1)';
  else if (yao.tombType === 'fei') bg = 'var(--yao-gray-bg)';

  const tombClass =
    yao.tombType === 'month' ? 'tomb-blue' :
    yao.tombType === 'day' ? 'tomb-orange' :
    yao.tombType === 'dong' ? 'tomb-yellow' :
    yao.tombType === 'hua' ? 'tomb-purple' :
    yao.tombType === 'fei' ? 'tomb-gray' : '';

  const text = withParens ? `（${label}）` : label;

  return (
    <span
      className={tombClass}
      style={{
        color,
        fontStyle: isItalic ? 'italic' : 'normal',
        background: bg,
        padding: tombClass ? '1px 2px' : undefined,
        position: 'relative',
        display: 'inline-block',
      }}
    >
      {text}
      {/* 月合/日合小字 */}
      {yao.isMonthHe && (
        <sup style={{ color: 'var(--yao-blue)', fontSize: 9, marginLeft: 1 }}>合</sup>
      )}
      {yao.isDayHe && (
        <sup style={{ color: 'var(--yao-orange)', fontSize: 9, marginLeft: 1 }}>合</sup>
      )}
    </span>
  );
}

// 变爻文字
function ChangedYaoText({ yao }: { yao: YaoState }) {
  if (!yao.changedBranch || !yao.changedFlags) return null;
  const f = yao.changedFlags;
  const label = BRANCH_LABEL[yao.changedBranch] ?? yao.changedBranch;

  let color = 'var(--text-secondary)';
  if (f.isHuaLinMonth || f.isHuaLinDay) color = 'var(--yao-orange)';

  let underlineClass = '';
  if (f.isFanYin) underlineClass = 'fanyin-line';
  else if (f.isFuYin) underlineClass = 'fuyin-line';

  // 箭头（回头生/克/化进/化退）
  let arrowEl: React.ReactNode = null;
  if (f.isHuiTouSheng) arrowEl = <span style={{ color: 'var(--yao-green)', fontSize: 12 }}> ←生</span>;
  else if (f.isHuiTouKe) arrowEl = <span style={{ color: 'var(--yao-red)', fontSize: 12 }}> ←克</span>;
  else if (f.isHuaJin) arrowEl = <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}> ↑</span>;
  else if (f.isHuaTui) arrowEl = <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}> ↓</span>;

  // 小字标注
  const sups: React.ReactNode[] = [];
  if (f.isHuaJue) sups.push(<sup key="jue" style={{ color: 'var(--text-muted)', fontSize: 9 }}>绝</sup>);
  if (f.isHuaPo) sups.push(<sup key="po" style={{ color: 'var(--yao-orange)', fontSize: 9 }}>破</sup>);

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <span className={underlineClass} style={{ color }}>{label}{sups}</span>
      {arrowEl}
    </span>
  );
}

// 爻线（考虑阴阳、动爻、暗动）
function YaoLine({ isYangYao, isMoving, isHidden }: { isYangYao: boolean; isMoving: boolean; isHidden: boolean }) {
  const solidLine = <div style={{ flex: 1, height: 4, background: 'var(--text-primary)', borderRadius: 2 }} />;
  const gap = <div style={{ width: 8 }} />;
  const halfLine = <div style={{ flex: 1, height: 4, background: 'var(--text-primary)', borderRadius: 2 }} />;

  if (isMoving) {
    // 动爻：老阳（阳变阴）用断线+实心圆，老阴（阴变阳）用断线+空心圆
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {halfLine}{gap}{halfLine}
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: isYangYao ? 'var(--moving-yao)' : 'transparent',
          border: '2px solid var(--moving-yao)',
          flexShrink: 0, marginLeft: 2,
        }} />
      </div>
    );
  }
  if (isHidden) {
    // 暗动：被日辰冲的阴爻，断线+虚线圆
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
        {halfLine}{gap}{halfLine}
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px dashed var(--yao-orange)',
          flexShrink: 0, marginLeft: 2,
        }} />
      </div>
    );
  }
  // 静爻：阳爻实线，阴爻断线
  if (isYangYao) {
    return solidLine;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
      {halfLine}{gap}{halfLine}
    </div>
  );
}

// 能量得分
function EnergyScore({ score }: { score: number }) {
  const cls = score > 0 ? 'score-positive' : score < 0 ? 'score-negative' : 'score-zero';
  const sign = score > 0 ? '+' : '';
  return <span className={cls}>{sign}{score}</span>;
}

export function YaoRow({ yao, isYongShen }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '40px 44px 1fr 30px 60px',
        gap: 6,
        alignItems: 'center',
        padding: '6px 4px',
        borderRadius: 6,
        background: isYongShen ? 'rgba(212,160,23,0.06)' : undefined,
        borderLeft: isYongShen ? '2px solid var(--gold-dim)' : '2px solid transparent',
      }}
    >
      {/* 六神 */}
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
        {yao.liuShen}
      </div>

      {/* 六亲 */}
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
        {yao.relative}
      </div>

      {/* 本卦爻 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
        <YaoLine isYangYao={yao.isYangYao} isMoving={yao.isMoving} isHidden={yao.isHidden} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
          <YaoBranchText yao={yao} />
          <EnergyScore score={yao.energyScore} />
        </div>
      </div>

      {/* 世/应 */}
      <div style={{ textAlign: 'center' }}>
        {yao.isWorldLine && <span className="badge-world">世</span>}
        {yao.isResponseLine && <span className="badge-response">应</span>}
      </div>

      {/* 变卦 */}
      <div style={{ textAlign: 'right', fontSize: 12 }}>
        {yao.isMoving && <ChangedYaoText yao={yao} />}
      </div>
    </div>
  );
}
