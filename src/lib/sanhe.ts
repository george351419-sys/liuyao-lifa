import type { YaoState, GanZhi, SanHeResult } from '../types';
import type { EarthlyBranch } from '../data/constants';

// 三合局定义
//   申子辰 → 中神 子 → 三合水局
//   亥卯未 → 中神 卯 → 三合木局
//   巳酉丑 → 中神 酉 → 三合金局
//   寅午戌 → 中神 午 → 三合火局
const SAN_HE_GROUPS: {
  branches: [EarthlyBranch, EarthlyBranch, EarthlyBranch];
  element: string;
  zhong: EarthlyBranch;
}[] = [
  { branches: ['申', '子', '辰'], element: '水', zhong: '子' },
  { branches: ['亥', '卯', '未'], element: '木', zhong: '卯' },
  { branches: ['巳', '酉', '丑'], element: '金', zhong: '酉' },
  { branches: ['寅', '午', '戌'], element: '火', zhong: '午' },
];

// 触发条件：本卦上的动爻 + 暗动 ≥ 2 个，则检查 5 条三合局成立条件。
//   条件 1) 三个地支全部发动（本卦地支直接构成 申子辰 / 亥卯未 / 巳酉丑 / 寅午戌）
//   条件 2) 一爻 + 三爻 同时发动，{一原, 一变, 三原, 三变} ⊇ 三合三支
//   条件 3) 四爻 + 六爻 同时发动，{四原, 四变, 六原, 六变} ⊇ 三合三支
//   条件 4) 中神(子卯酉午) 发动 + 另一组员发动 + 日辰或月建为剩余的那一支
//   条件 5) 中神发动 + 日辰、月建 分别为另外两支
//
// 任一条件满足即返回 SanHeResult；多个组都满足时取首个匹配。
export function detectSanHe(yaos: YaoState[], ganzhi: GanZhi): SanHeResult | null {
  const { monthBranch, dayBranch } = ganzhi;
  const activeCount = yaos.filter(y => y.isMoving || y.isHidden).length;
  if (activeCount < 2) return null;

  const movingYaos = yaos.filter(y => y.isMoving);

  for (const group of SAN_HE_GROUPS) {
    const [b1, b2, b3] = group.branches;
    const groupSet = new Set<EarthlyBranch>([b1, b2, b3]);

    // ── 条件 1：三个地支全部发动 ──
    const b1Yao = movingYaos.find(y => y.yaoBranch === b1);
    const b2Yao = movingYaos.find(y => y.yaoBranch === b2);
    const b3Yao = movingYaos.find(y => y.yaoBranch === b3);
    if (b1Yao && b2Yao && b3Yao) {
      return {
        element: group.element, zhongShen: group.zhong,
        yaos: [b1Yao.position, b2Yao.position, b3Yao.position].sort((a, b) => a - b),
        isComplete: true,
      };
    }

    // ── 条件 2：一爻 + 三爻 同动，{一原, 一变, 三原, 三变} ⊇ 三合三支 ──
    const y1 = yaos[0], y3 = yaos[2];
    if (y1.isMoving && y3.isMoving && y1.changedBranch && y3.changedBranch) {
      const pool = new Set<EarthlyBranch>([
        y1.yaoBranch, y1.changedBranch,
        y3.yaoBranch, y3.changedBranch,
      ]);
      if ([b1, b2, b3].every(b => pool.has(b))) {
        return {
          element: group.element, zhongShen: group.zhong,
          yaos: [1, 3], isComplete: true,
        };
      }
    }

    // ── 条件 3：四爻 + 六爻 同动，{四原, 四变, 六原, 六变} ⊇ 三合三支 ──
    const y4 = yaos[3], y6 = yaos[5];
    if (y4.isMoving && y6.isMoving && y4.changedBranch && y6.changedBranch) {
      const pool = new Set<EarthlyBranch>([
        y4.yaoBranch, y4.changedBranch,
        y6.yaoBranch, y6.changedBranch,
      ]);
      if ([b1, b2, b3].every(b => pool.has(b))) {
        return {
          element: group.element, zhongShen: group.zhong,
          yaos: [4, 6], isComplete: true,
        };
      }
    }

    // ── 条件 4 / 5：中神发动相关 ──
    const zhongMoving = movingYaos.find(y => y.yaoBranch === group.zhong);
    if (zhongMoving) {
      const others = [b1, b2, b3].filter(b => b !== group.zhong) as [EarthlyBranch, EarthlyBranch];

      // 条件 4：中神动 + 另一组员动 + 日辰/月建为剩余支
      const otherMoving = movingYaos.find(
        y => y.position !== zhongMoving.position && (groupSet.has(y.yaoBranch) && y.yaoBranch !== group.zhong),
      );
      if (otherMoving) {
        const remaining = others.find(b => b !== otherMoving.yaoBranch)!;
        if (dayBranch === remaining || monthBranch === remaining) {
          return {
            element: group.element, zhongShen: group.zhong,
            yaos: [zhongMoving.position, otherMoving.position].sort((a, b) => a - b),
            isComplete: true,
          };
        }
      }

      // 条件 5：中神动 + 日辰 + 月建 分别为另外两支
      const [o1, o2] = others;
      const dmHasO1 = dayBranch === o1 || monthBranch === o1;
      const dmHasO2 = dayBranch === o2 || monthBranch === o2;
      if (dmHasO1 && dmHasO2 && dayBranch !== monthBranch) {
        return {
          element: group.element, zhongShen: group.zhong,
          yaos: [zhongMoving.position],
          isComplete: true,
        };
      }
    }
  }

  return null;
}
