import type { ChangedYaoFlags, YaoFinalState, YaoState } from '../types';
import type { EarthlyBranch } from '../data/constants';
import { CHONG_MAP, BRANCH_ELEMENT, SHENG_MAP, KE_MAP, JUE_DI, HUA_JIN_MAP, HUA_TUI_MAP } from '../data/constants';
import { isMonthPoCheck, isDayPoCheck, isInXunKong } from './special';

export function detectChangedFlags(
  movingBranch: EarthlyBranch,
  changedBranch: EarthlyBranch,
  monthBranch: EarthlyBranch,
  dayBranch: EarthlyBranch,
  monthXunKong: [EarthlyBranch, EarthlyBranch],
  dayXunKong: [EarthlyBranch, EarthlyBranch],
  _allYaos: YaoState[]
): ChangedYaoFlags {
  const mEl = BRANCH_ELEMENT[movingBranch];
  const cEl = BRANCH_ELEMENT[changedBranch];

  const isFanYin = CHONG_MAP[movingBranch] === changedBranch;
  const isFuYin = movingBranch === changedBranch;
  const isHuiTouSheng = SHENG_MAP[cEl] === mEl;            // 变爻生动爻
  const isHuiTouKe = KE_MAP[cEl] === mEl;                  // 变爻克动爻
  const isHuaJin = HUA_JIN_MAP[movingBranch] === changedBranch;
  const isHuaTui = HUA_TUI_MAP[movingBranch] === changedBranch;
  const isHuaJue = JUE_DI[mEl] === changedBranch;          // 变爻是动爻的绝地
  const isHuaPo = isMonthPoCheck(changedBranch, monthBranch) || isDayPoCheck(changedBranch, dayBranch);
  const isHuaLinMonth = changedBranch === monthBranch;
  const isHuaLinDay = changedBranch === dayBranch;
  const isHuaMonthXunKong = isInXunKong(changedBranch, monthXunKong);
  const isHuaDayXunKong = isInXunKong(changedBranch, dayXunKong);

  return {
    isFanYin,
    isFuYin,
    isHuiTouSheng,
    isHuiTouKe,
    isHuaJin,
    isHuaTui,
    isHuaJue,
    isHuaPo,
    isHuaLinMonth,
    isHuaLinDay,
    isHuaMonthXunKong,
    isHuaDayXunKong,
  };
}

export function calcFinalState(flags: ChangedYaoFlags): YaoFinalState {
  const isFei =
    flags.isHuiTouKe || flags.isHuaTui || flags.isHuaPo || flags.isHuaJue
    || flags.isHuaMonthXunKong || flags.isHuaDayXunKong;
  const isWang =
    flags.isHuiTouSheng || flags.isHuaJin || flags.isHuaLinDay || flags.isHuaLinMonth;

  if (isFei && isWang) return '化旺也化废';
  if (isFei) return '化废';
  if (isWang) return '化旺';
  return '平动';
}
