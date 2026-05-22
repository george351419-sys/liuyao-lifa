import type { YaoState, GanZhi } from '../types';
import type { EarthlyBranch } from '../data/constants';
import { CHONG_MAP, HE_MAP } from '../data/constants';
import { getMonthScore } from '../data/scoreTables';

// 判断地支是否在旬空列表中
export function isInXunKong(branch: EarthlyBranch, xunKong: [EarthlyBranch, EarthlyBranch]): boolean {
  return branch === xunKong[0] || branch === xunKong[1];
}

// 判断月破：爻地支被月建冲
export function isMonthPoCheck(branch: EarthlyBranch, monthBranch: EarthlyBranch): boolean {
  return CHONG_MAP[monthBranch] === branch;
}

// 判断日破：爻地支被日辰冲
export function isDayPoCheck(branch: EarthlyBranch, dayBranch: EarthlyBranch): boolean {
  return CHONG_MAP[dayBranch] === branch;
}

// 判断月合：爻地支与月建六合
export function isMonthHeCheck(branch: EarthlyBranch, monthBranch: EarthlyBranch): boolean {
  return HE_MAP[monthBranch] === branch;
}

// 判断日合：爻地支与日辰六合
export function isDayHeCheck(branch: EarthlyBranch, dayBranch: EarthlyBranch): boolean {
  return HE_MAP[dayBranch] === branch;
}

// 判断暗动：被日辰冲，且满足以下任一：
// 1. 月建先天得分 > 0
// 2. 被盘上的动爻生（下方在循环后判断）
// 3. 该爻是旬空
export function isAnDongCheck(
  branch: EarthlyBranch,
  dayBranch: EarthlyBranch,
  monthBranch: EarthlyBranch,
  dayXunKong: [EarthlyBranch, EarthlyBranch],
  isAlreadyMoving: boolean
): boolean {
  if (isAlreadyMoving) return false; // 已经是动爻就不是暗动
  const dayChonged = isDayPoCheck(branch, dayBranch);
  if (!dayChonged) return false;
  const monthScore = getMonthScore(branch, monthBranch);
  const isMonthXK = isInXunKong(branch, dayXunKong);
  // 满足条件1或3即可（被动爻生的条件在循环后再修正）
  return monthScore > 0 || isMonthXK;
}

// 主函数：遍历所有爻，设置特殊标注
export function detectSpecialFlags(yaos: YaoState[], ganzhi: GanZhi): void {
  const { monthBranch, dayBranch, monthXunKong, dayXunKong } = ganzhi;

  for (const yao of yaos) {
    const { yaoBranch, isMoving } = yao;

    yao.isMonthXunKong = isInXunKong(yaoBranch, monthXunKong);
    yao.isDayXunKong = isInXunKong(yaoBranch, dayXunKong);
    yao.isMonthPo = isMonthPoCheck(yaoBranch, monthBranch);
    yao.isMonthHe = isMonthHeCheck(yaoBranch, monthBranch);
    yao.isDayHe = isDayHeCheck(yaoBranch, dayBranch);

    const dayChonged = isDayPoCheck(yaoBranch, dayBranch);

    if (!isMoving && dayChonged) {
      // 判断暗动
      const monthScore = getMonthScore(yaoBranch, monthBranch);
      const isMonthXK = isInXunKong(yaoBranch, monthXunKong);
      // 被动爻生：检查是否有动爻五行生该爻
      const beingShengByMoving = isBeingShengByMoving(yao, yaos);

      if (monthScore > 0 || isMonthXK || beingShengByMoving) {
        yao.isHidden = true;
        yao.isDayPo = false;
      } else {
        yao.isDayPo = true;
      }
    } else {
      yao.isDayPo = false;
    }
  }
}

import { SHENG_MAP, BRANCH_ELEMENT } from '../data/constants';

function isBeingShengByMoving(yao: YaoState, allYaos: YaoState[]): boolean {
  const yaoElement = BRANCH_ELEMENT[yao.yaoBranch];
  return allYaos.some(y => y.isMoving && SHENG_MAP[BRANCH_ELEMENT[y.yaoBranch]] === yaoElement);
}
