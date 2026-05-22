import type { GanZhi } from '../types';

interface Props {
  ganzhi: GanZhi;
}

export function GanzhiBar({ ganzhi }: Props) {
  const { yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch, monthXunKong, dayXunKong } = ganzhi;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 14, color: 'var(--text-primary)' }}>
        <span>{yearStem}{yearBranch}年</span>
        <span>{monthStem}{monthBranch}月</span>
        <span>{dayStem}{dayBranch}日</span>
        <span>{hourStem}{hourBranch}时</span>
      </div>
      <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-secondary)' }}>
        <span>
          月旬空：
          <span style={{ color: 'var(--yao-blue)' }}>{monthXunKong[0]}</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>·</span>
          <span style={{ color: 'var(--yao-blue)' }}>{monthXunKong[1]}</span>
        </span>
        <span>
          日旬空：
          <span style={{ color: 'var(--yao-orange)' }}>{dayXunKong[0]}</span>
          <span style={{ color: 'var(--text-muted)', margin: '0 2px' }}>·</span>
          <span style={{ color: 'var(--yao-orange)' }}>{dayXunKong[1]}</span>
        </span>
      </div>
    </div>
  );
}
