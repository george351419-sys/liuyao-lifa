import type { YaoState, GanZhi } from '../types';
import { BRANCH_ELEMENT, MU_KU } from '../data/constants';
import type { EarthlyBranch } from '../data/constants';

// 判断某五行进入某地支的墓库
function entersTomu(element: string, tombBranch: EarthlyBranch): boolean {
  return MU_KU[element] === tombBranch;
}

// 判断某地支是否是四墓库之一（辰戌丑未）
function isMuKuBranch(branch: EarthlyBranch): boolean {
  return branch === '辰' || branch === '戌' || branch === '丑' || branch === '未';
}

export function checkAllTombs(yaos: YaoState[], ganzhi: GanZhi): void {
  const { monthBranch, dayBranch } = ganzhi;

  for (const yao of yaos) {
    const el = BRANCH_ELEMENT[yao.yaoBranch];

    // 入月建墓：月建是四墓库，且该爻五行进入月建墓库
    if (isMuKuBranch(monthBranch) && entersTomu(el, monthBranch)) {
      if (!yao.tombType) yao.tombType = 'month';
      continue;
    }

    // 入日辰墓：日辰是四墓库，且该爻五行进入日辰墓库
    if (isMuKuBranch(dayBranch) && entersTomu(el, dayBranch)) {
      if (!yao.tombType) yao.tombType = 'day';
      continue;
    }

    // 入动墓：静爻进入某动爻的墓库（动爻是四墓库）
    if (!yao.isMoving && !yao.isHidden) {
      const hasDongMu = yaos.some(dy => {
        if (!dy.isMoving) return false;
        if (!isMuKuBranch(dy.yaoBranch)) return false;
        return entersTomu(el, dy.yaoBranch);
      });
      if (hasDongMu) {
        if (!yao.tombType) yao.tombType = 'dong';
        continue;
      }
    }

    // 入化墓：动爻进入其变爻的墓库（变爻是四墓库）
    if (yao.isMoving && yao.changedBranch) {
      if (isMuKuBranch(yao.changedBranch) && entersTomu(el, yao.changedBranch)) {
        if (!yao.tombType) yao.tombType = 'hua';
        continue;
      }
    }
  }
}
