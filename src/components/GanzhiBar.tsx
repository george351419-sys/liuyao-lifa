import type { GanZhi } from '../types';

interface Props {
  ganzhi: GanZhi;
  tombFill?: { month: boolean; day: boolean };
}

export function GanzhiBar({ ganzhi, tombFill }: Props) {
  const { yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch, monthXunKong, dayXunKong } = ganzhi;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 14, color: 'var(--text-primary)', fontFamily: 'serif', letterSpacing: 0.5 }}>
        <span>{yearStem}{yearBranch}<span style={{ color: 'var(--text-muted)', fontSize: 11 }}>年</span></span>
        <span>
          {monthStem}
          <span className={tombFill?.month ? 'tomb-fill-blue' : undefined}>{monthBranch}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>月</span>
        </span>
        <span>
          {dayStem}
          <span className={tombFill?.day ? 'tomb-fill-orange' : undefined}>{dayBranch}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>日</span>
        </span>
        <span>{hourStem}{hourBranch}<span style={{ color: 'var(--text-muted)', fontSize: 11 }}>时</span></span>
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
