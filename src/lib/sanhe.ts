import type { YaoState, GanZhi, SanHeResult } from '../types';
import type { EarthlyBranch } from '../data/constants';

// 三合局定义
const SAN_HE_GROUPS: { branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch]; element: string; zhong: EarthlyBranch }[] = [
  { branches: ['申', '子', '辰'], element: '水', zhong: '子' },
  { branches: ['亥', '卯', '未'], element: '木', zhong: '卯' },
  { branches: ['巳', '酉', '丑'], element: '金', zhong: '酉' },
  { branches: ['寅', '午', '戌'], element: '火', zhong: '午' },
];

export function detectSanHe(yaos: YaoState[], ganzhi: GanZhi): SanHeResult | null {
  const { monthBranch, dayBranch } = ganzhi;
  const activeYaos = yaos.filter(y => y.isMoving || y.isHidden);
  if (activeYaos.length < 2) return null;

  for (const group of SAN_HE_GROUPS) {
    const [b1, b2, b3] = group.branches;
    // 条件1：三个地支全部发动，且能组成合三局
    const allThreeActive = [b1, b2, b3].every(b => activeYaos.some(y => y.yaoBranch === b || y.changedBranch === b));
    if (allThreeActive) {
      return { element: group.element, zhongShen: group.zhong, yaos: activeYaos.map(y => y.position), isComplete: true };
    }

    // 条件4：中神发动 + 任一动爻 + 日辰或月建
    const zhongActive = activeYaos.some(y => y.yaoBranch === group.zhong || y.changedBranch === group.zhong);
    if (zhongActive && activeYaos.length >= 1) {
      const dayOrMonthMatch = [dayBranch, monthBranch].some(b => b === b1 || b === b2 || b === b3);
      if (dayOrMonthMatch) {
        return { element: group.element, zhongShen: group.zhong, yaos: activeYaos.map(y => y.position), isComplete: true };
      }
    }

    // 条件5：中神发动 + 日辰 + 月建
    const dayMatch = dayBranch === b1 || dayBranch === b2 || dayBranch === b3;
    const monthMatch = monthBranch === b1 || monthBranch === b2 || monthBranch === b3;
    if (zhongActive && dayMatch && monthMatch) {
      return { element: group.element, zhongShen: group.zhong, yaos: activeYaos.map(y => y.position), isComplete: true };
    }
  }

  return null;
}
