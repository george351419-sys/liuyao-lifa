import type { YaoState } from '../types';
import type { EarthlyBranch } from '../data/constants';
import { BRANCH_LABEL } from '../data/constants';

interface Props {
  yao: YaoState;
  isYongShen: boolean;
  showChangedLine: boolean;
}

// ─── 列宽（与 HexagramBoard 共享）───
// 世应 六神 六亲 地支 爻线 动标 ┃ 变爻线 变六亲 变地支
export const COL = '13px 20px 28px minmax(54px,1fr) minmax(40px,1fr) 16px 3px minmax(40px,1fr) 22px minmax(65px,1.5fr)';
export const GAP = 2;

// ─── 通用地支标签（仅包含纯地支字 + 旬空括号 + 入墓虚线框/底色） ───
// 合/破/绝/分数等右下角小注 由外层 BranchWithScore 渲染，不进入虚线框/底色范围
interface BranchLabelProps {
  branch: EarthlyBranch;
  isMonthXK?: boolean;
  isDayXK?: boolean;
  isMonthPo?: boolean;
  isDayPo?: boolean;
  tombType?: string | null;
  tombFill?: 'month' | 'day' | 'dong' | 'hua' | null; // 自身作为墓库容器
  muted?: boolean;
}

function BranchLabel({
  branch, isMonthXK, isDayXK, isMonthPo, isDayPo, tombType, tombFill, muted
}: BranchLabelProps) {
  const raw = BRANCH_LABEL[branch] ?? branch;
  let color = muted ? 'var(--text-muted)' : 'var(--text-primary)';
  let italic = false;
  let tombCls = '';
  let bg = 'transparent';

  if      (isMonthXK) { color = 'var(--yao-blue)'; }
  else if (isDayXK)   { color = 'var(--yao-orange)'; }
  else if (isMonthPo) { color = 'var(--yao-blue)';   italic = true; }
  else if (isDayPo)   { color = 'var(--yao-orange)'; italic = true; }

  if      (tombType === 'month') { tombCls = 'tomb-blue';   bg = 'var(--yao-blue-bg)'; }
  else if (tombType === 'day')   { tombCls = 'tomb-orange'; bg = 'var(--yao-orange-bg)'; }
  else if (tombType === 'dong')  { tombCls = 'tomb-yellow'; bg = 'var(--yao-yellow-bg)'; }
  else if (tombType === 'hua')   { tombCls = 'tomb-purple'; bg = 'rgba(100,60,140,0.06)'; }
  else if (tombType === 'fei')   { tombCls = 'tomb-gray';   bg = 'var(--yao-gray-bg)'; }

  let fillCls = '';
  if      (tombFill === 'month') fillCls = 'tomb-fill-blue';
  else if (tombFill === 'day')   fillCls = 'tomb-fill-orange';
  else if (tombFill === 'dong')  fillCls = 'tomb-fill-yellow';
  else if (tombFill === 'hua')   fillCls = 'tomb-fill-purple';

  // 旬空小圆圈：紧贴地支字右侧，月空蓝色，日空橙色（实心点示意）
  const xkDot = isMonthXK
    ? 'var(--yao-blue)'
    : isDayXK
      ? 'var(--yao-orange)'
      : null;

  return (
    <span className={tombCls} style={{
      color, background: bg,
      fontStyle: italic ? 'italic' : 'normal',
      padding: tombCls ? '0 1px' : undefined,
      whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'baseline',
    }}>
      <span className={fillCls || undefined}>{raw}</span>
      {xkDot && (
        <span
          aria-label={isMonthXK ? '月建旬空' : '日辰旬空'}
          style={{
            display: 'inline-block',
            width: 7, height: 7,
            borderRadius: '50%',
            background: 'transparent',
            border: `1.3px solid ${xkDot}`,
            marginLeft: 3,
            alignSelf: 'center',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        />
      )}
    </span>
  );
}

// ─── 变爻地支（含反吟/伏吟下划线 + 化墓底色 + 箭头标注）───
// 绝/破/分数等小注由外层在 right-bottom 渲染
function ChangedBranchLabel({ yao }: { yao: YaoState }) {
  if (!yao.changedBranch || !yao.changedFlags) return null;
  const f = yao.changedFlags;
  const raw = BRANCH_LABEL[yao.changedBranch] ?? yao.changedBranch;
  let color = 'var(--text-secondary)';
  if (f.isHuaLinMonth || f.isHuaLinDay) color = 'var(--yao-orange)';
  const underCls = f.isFanYin ? 'fanyin-line' : f.isFuYin ? 'fuyin-line' : '';
  const fillCls = yao.changedBranchTombFill === 'hua' ? 'tomb-fill-purple' : '';
  let arrow: React.ReactNode = null;
  if      (f.isHuiTouSheng) arrow = <span style={{ color: 'var(--yao-green)', fontSize: 9 }}> ←生</span>;
  else if (f.isHuiTouKe)   arrow = <span style={{ color: 'var(--yao-red)',   fontSize: 9 }}> ←克</span>;
  else if (f.isHuaJin)     arrow = <span style={{ color: 'var(--text-muted)', fontSize: 9 }}> ↑</span>;
  else if (f.isHuaTui)     arrow = <span style={{ color: 'var(--text-muted)', fontSize: 9 }}> ↓</span>;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 1, whiteSpace: 'nowrap' }}>
      <span className={[underCls, fillCls].filter(Boolean).join(' ') || undefined} style={{ color }}>
        {raw}
      </span>
      {arrow}
    </span>
  );
}

// 变爻右下角小注：化绝 / 化破 / 变爻能量分
function ChangedAnnotations({ yao, score }: { yao: YaoState; score?: number }) {
  const f = yao.changedFlags;
  if (!f && score === undefined) return null;
  const items: React.ReactNode[] = [];
  if (f?.isHuaJue) items.push(<span key="j" style={{ color: 'var(--text-muted)' }}>绝</span>);
  if (f?.isHuaPo)  items.push(<span key="p" style={{ color: 'var(--yao-orange)' }}>破</span>);
  if (score !== undefined) {
    items.push(
      <span key="sc" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        {score > 0 ? '+' : ''}{score}
      </span>
    );
  }
  if (items.length === 0) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'flex-end', gap: 1,
      fontSize: 9, lineHeight: 1, marginBottom: 1,
    }}>
      {items}
    </span>
  );
}

// ─── 地支 + 右下角小注（合/破/分数）───
interface BranchWithScoreProps extends BranchLabelProps {
  score?: number;
  isMonthHe?: boolean;
  isDayHe?: boolean;
  smaller?: boolean; // 伏神行用更小字号
}
function BranchWithScore(props: BranchWithScoreProps) {
  const { score, isMonthHe, isDayHe, isMonthPo, isDayPo, smaller, ...branchProps } = props;
  const anno: React.ReactNode[] = [];
  if (isMonthHe) anno.push(<span key="mh" style={{ color: 'var(--yao-blue)'   }}>合</span>);
  if (isDayHe)   anno.push(<span key="dh" style={{ color: 'var(--yao-orange)' }}>合</span>);
  if (isMonthPo) anno.push(<span key="mp" style={{ color: 'var(--yao-blue)'   }}>破</span>);
  if (isDayPo)   anno.push(<span key="dp" style={{ color: 'var(--yao-orange)' }}>破</span>);
  if (score !== undefined) {
    anno.push(
      <span key="sc" style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        {score > 0 ? '+' : ''}{score}
      </span>
    );
  }
  return (
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2 }}>
      <BranchLabel {...branchProps} isMonthPo={isMonthPo} isDayPo={isDayPo} />
      {anno.length > 0 && (
        <span style={{
          display: 'inline-flex', alignItems: 'flex-end', gap: 1,
          fontSize: smaller ? 8 : 9, lineHeight: 1, marginBottom: 1,
        }}>
          {anno}
        </span>
      )}
    </div>
  );
}

// ─── 本卦爻线 ───
function YaoLine({ isYangYao }: { isYangYao: boolean }) {
  const ink = 'var(--text-primary)';
  const h = 5;
  if (isYangYao) return <div style={{ height: h, background: ink, borderRadius: 3, width: '100%' }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%' }}>
      <div style={{ flex: 1, height: h, background: ink, borderRadius: 3 }} />
      <div style={{ flex: 1, height: h, background: ink, borderRadius: 3 }} />
    </div>
  );
}

// ─── 变卦爻线（稍细稍淡）───
function ChangedLine({ isYang }: { isYang: boolean }) {
  const ink = 'var(--text-secondary)';
  const h = 4;
  if (isYang) return <div style={{ height: h, background: ink, borderRadius: 2, width: '100%', opacity: 0.6 }} />;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', opacity: 0.6 }}>
      <div style={{ flex: 1, height: h, background: ink, borderRadius: 2 }} />
      <div style={{ flex: 1, height: h, background: ink, borderRadius: 2 }} />
    </div>
  );
}

// ─── 动爻标记 ───
function MovingMark({ isMoving, isHidden }: { isMoving: boolean; isHidden: boolean }) {
  if (isMoving) {
    return <span style={{ color: 'var(--gold-mid)', fontSize: 13, fontWeight: 700, lineHeight: 1 }}>→</span>;
  }
  if (isHidden) {
    return (
      <div style={{
        width: 12, height: 12, borderRadius: '50%',
        border: '1.5px dashed var(--yao-orange)',
      }} />
    );
  }
  return null;
}

// ─── 单行网格基础样式 ───
const gridBase: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: COL,
  gap: GAP,
  alignItems: 'center',
};

export function YaoRow({ yao, isYongShen, showChangedLine }: Props) {
  const hasFuShen = !!yao.fuShenBranch;
  const rightIsYang = yao.isMoving ? (yao.changedIsYang ?? !yao.isYangYao) : yao.isYangYao;
  const rightRelative = yao.isMoving ? (yao.changedRelative ?? yao.relative) : yao.relative;
  const rightScore = yao.isMoving ? yao.changedEnergyScore : yao.energyScore;

  return (
    <div style={{
      borderLeft: isYongShen ? '2px solid var(--gold-mid)' : '2px solid transparent',
      background: isYongShen ? 'rgba(154,111,10,0.04)' : undefined,
      // 固定每爻高度，让有 / 无伏神的"主爻线"间距一致
      minHeight: 52,
      paddingTop: 5,
      paddingBottom: 5,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── 主爻行 ── */}
      <div style={{ ...gridBase, minHeight: 30 }}>

        {/* 世/应（左侧，纯文字） */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1, lineHeight: 1 }}>
          {yao.isWorldLine    && <span className="badge-world">世</span>}
          {yao.isResponseLine && <span className="badge-response">应</span>}
        </div>

        {/* 六神 */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center' }}>
          {yao.liuShen}
        </div>

        {/* 六亲 */}
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'right', paddingRight: 3 }}>
          {yao.relative}
        </div>

        {/* 地支 + 能量分数（左对齐，留出与六亲列的间距） */}
        <div style={{ paddingLeft: 24, display: 'flex', justifyContent: 'flex-start' }}>
          <BranchWithScore
            branch={yao.yaoBranch}
            isMonthXK={yao.isMonthXunKong}
            isDayXK={yao.isDayXunKong}
            isMonthPo={yao.isMonthPo}
            isDayPo={yao.isDayPo}
            isMonthHe={yao.isMonthHe}
            isDayHe={yao.isDayHe}
            tombType={yao.tombType}
            tombFill={yao.yaoBranchTombFill ?? null}
            score={yao.energyScore}
          />
        </div>

        {/* 本卦爻线 */}
        <div style={{ display: 'flex', alignItems: 'center', paddingRight: 2 }}>
          <YaoLine isYangYao={yao.isYangYao} />
        </div>

        {/* 动爻标记 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <MovingMark isMoving={yao.isMoving} isHidden={yao.isHidden} />
        </div>

        {/* 分隔列（仅留间距，去除可见竖线，让排盘更清爽） */}
        <span />

        {/* 变卦爻线 */}
        <div style={{ display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
          {showChangedLine && <ChangedLine isYang={rightIsYang} />}
        </div>

        {/* 变六亲 */}
        <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', paddingLeft: 2 }}>
          {showChangedLine ? rightRelative : ''}
        </div>

        {/* 变地支 + 右下角小注 */}
        <div style={{ paddingLeft: 2 }}>
          {showChangedLine && (
            yao.isMoving
              ? <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2 }}>
                  <ChangedBranchLabel yao={yao} />
                  <ChangedAnnotations yao={yao} score={rightScore} />
                </span>
              : <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.45 }}>
                  {BRANCH_LABEL[yao.yaoBranch] ?? yao.yaoBranch}
                </span>
          )}
        </div>
      </div>

      {/* ── 伏神行（有伏神时，整体更紧凑、字号更小） ── */}
      {hasFuShen && (
        <div style={{ ...gridBase, marginTop: 1, fontSize: 10 }}>
          {/* 世应空 */}
          <span />
          {/* 六神空 */}
          <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>伏</span>
          {/* 伏神六亲（不再斜体） */}
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'right', paddingRight: 3 }}>
            {yao.fuShenRelative}
          </div>
          {/* 伏神地支 + 分数（与本卦地支同列、左对齐，整体小一号） */}
          <div style={{ paddingLeft: 24, display: 'flex', justifyContent: 'flex-start', fontSize: 11 }}>
            <BranchWithScore
              branch={yao.fuShenBranch!}
              isMonthXK={yao.fuShenIsMonthXK}
              isDayXK={yao.fuShenIsDayXK}
              isMonthPo={yao.fuShenIsMonthPo}
              isDayPo={yao.fuShenIsDayPo}
              isMonthHe={yao.fuShenIsMonthHe}
              isDayHe={yao.fuShenIsDayHe}
              tombType={null}
              muted
              smaller
              score={yao.fuShenEnergyScore}
            />
          </div>
          {/* 其余列空 */}
          <span /><span /><span /><span /><span /><span />
        </div>
      )}
    </div>
  );
}
