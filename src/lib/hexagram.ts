import type { YaoType, GanZhi, YaoState, HexagramResult, HexagramInput } from '../types';
import type { EarthlyBranch, SixRelative } from '../data/constants';
import { BRANCH_ELEMENT, LIUSHEN_START, LIUSHEN_NAMES } from '../data/constants';
import { isYang, isMovingYao } from './divination';
import { findHexagram, calcChangedLines, calcRelative, getPalacePureBranches, getPalaceElement } from '../data/hexagrams';
import { getMonthScore, getDayScore } from '../data/scoreTables';
import { detectSpecialFlags, isInXunKong, isMonthPoCheck, isDayPoCheck, isMonthHeCheck, isDayHeCheck } from './special';
import { detectChangedFlags, calcFinalState } from './changed';
import { checkAllTombs } from './tomb';
import { detectSanHe } from './sanhe';
import { selectYongShen, generateJudgment } from './judgment';
import { computeDongYaoAnalysis } from './dongYaoSelector';

export function buildHexagramResult(input: HexagramInput, yaoCodes: YaoType[], ganzhi: GanZhi): HexagramResult {
  const originalLines = yaoCodes.map(isYang) as [0|1,0|1,0|1,0|1,0|1,0|1];
  const movingPositions = yaoCodes.map((c, i) => isMovingYao(c) ? i + 1 : -1).filter(p => p > 0);

  const originalHex = findHexagram(originalLines);
  if (!originalHex) throw new Error('无法找到对应卦象，请检查输入');

  const changedLines = movingPositions.length > 0 ? calcChangedLines(originalLines, movingPositions) : null;
  const changedHex = changedLines ? findHexagram(changedLines) : undefined;

  const startLiuShen = LIUSHEN_START[ganzhi.dayStem] ?? 0;
  const liuShens = Array.from({length: 6}, (_, i) => LIUSHEN_NAMES[(startLiuShen + i) % 6]);

  // 六亲以本卦的"宫五行"为我（六爻法），变爻、伏神亦沿用本卦宫
  const palaceElement = getPalaceElement(originalHex.name);

  const yaos: YaoState[] = yaoCodes.map((code, idx) => {
    const position = (idx + 1) as 1|2|3|4|5|6;
    const yaoBranch = originalHex.branches[idx];
    const yaoElement = BRANCH_ELEMENT[yaoBranch];
    const isMoving = isMovingYao(code);

    const changedBranch = isMoving && changedHex ? changedHex.branches[idx] : undefined;
    const changedElement = changedBranch ? BRANCH_ELEMENT[changedBranch] : undefined;
    const changedRelative = changedBranch ? calcRelative(palaceElement, changedBranch) : undefined;
    const changedIsYang = isMoving ? (originalLines[idx] === 0) : undefined;

    const monthScore = getMonthScore(yaoBranch, ganzhi.monthBranch);
    const dayScore = getDayScore(yaoBranch, ganzhi.dayBranch);
    const energyScore = parseFloat((monthScore + dayScore).toFixed(1));

    // 变卦能量（动爻才有意义）
    const changedEnergyScore = changedBranch
      ? parseFloat((getMonthScore(changedBranch, ganzhi.monthBranch) + getDayScore(changedBranch, ganzhi.dayBranch)).toFixed(1))
      : undefined;

    return {
      position,
      yaoBranch, yaoElement,
      isYangYao: originalLines[idx] === 1,
      relative: calcRelative(palaceElement, yaoBranch),
      liuShen: liuShens[idx],
      isMoving, isHidden: false,
      changedBranch, changedElement, changedRelative, changedIsYang,
      changedEnergyScore,
      isWorldLine: position === originalHex.worldLine,
      isResponseLine: position === originalHex.responseLine,
      monthScore, dayScore, energyScore,
      isMonthXunKong: false, isDayXunKong: false,
      isMonthPo: false, isDayPo: false,
      isMonthHe: false, isDayHe: false,
      tombType: null,
    };
  });

  detectSpecialFlags(yaos, ganzhi);

  for (const yao of yaos) {
    if (yao.isMoving && yao.changedBranch) {
      yao.changedFlags = detectChangedFlags(
        yao.yaoBranch, yao.changedBranch,
        ganzhi.monthBranch, ganzhi.dayBranch,
        ganzhi.monthXunKong, ganzhi.dayXunKong,
      );
      yao.finalState = calcFinalState(yao.changedFlags);
    }
  }

  const tombFill = checkAllTombs(yaos, ganzhi);
  calcFuShen(yaos, originalHex.name, ganzhi);

  const sanHe = detectSanHe(yaos, ganzhi);
  const { yongShen, yongShenList } = selectYongShen(yaos, input.category, ganzhi);
  const worldLine = yaos.find(y => y.isWorldLine) ?? yaos[0];
  // 先算动爻分析（决定哪些动爻作为"动爻影响"的源），再算 judgment
  const dongYaoAnalysis = computeDongYaoAnalysis(
    yaos, sanHe, ganzhi, input.dongYaoMode ?? 'average', worldLine, yongShen,
  );
  const judgment = generateJudgment(yaos, worldLine, yongShen, ganzhi, sanHe, dongYaoAnalysis);

  return {
    ganzhi, originalHexagram: originalHex, changedHexagram: changedHex,
    yaos, sanHe, yongShen, yongShenList, judgment, dongYaoAnalysis, tombFill,
  };
}

function calcFuShen(yaos: YaoState[], hexName: string, ganzhi: GanZhi): void {
  const presentRelatives = new Set(yaos.map(y => y.relative));
  const allRelatives: SixRelative[] = ['父母','兄弟','子孙','妻财','官鬼'];
  const missingRelatives = allRelatives.filter(r => !presentRelatives.has(r));
  if (missingRelatives.length === 0) return;

  const pureBranches = getPalacePureBranches(hexName);
  const palaceElement = getPalaceElement(hexName);
  const { monthBranch, dayBranch, monthXunKong, dayXunKong } = ganzhi;

  for (const missing of missingRelatives) {
    for (let i = 0; i < 6; i++) {
      const branch = pureBranches[i] as EarthlyBranch;
      const rel = calcRelative(palaceElement, branch);
      if (rel === missing) {
        const targetYao = yaos[i];
        if (!targetYao.fuShenBranch) {
          targetYao.fuShenBranch = branch;
          targetYao.fuShenElement = BRANCH_ELEMENT[branch];
          targetYao.fuShenRelative = missing;
          // 伏神能量
          const ms = getMonthScore(branch, monthBranch);
          const ds = getDayScore(branch, dayBranch);
          targetYao.fuShenEnergyScore = parseFloat((ms + ds).toFixed(1));
          // 伏神特殊标记
          targetYao.fuShenIsMonthXK = isInXunKong(branch, monthXunKong);
          targetYao.fuShenIsDayXK   = isInXunKong(branch, dayXunKong);
          targetYao.fuShenIsMonthPo = isMonthPoCheck(branch, monthBranch);
          targetYao.fuShenIsDayPo   = isDayPoCheck(branch, dayBranch);
          targetYao.fuShenIsMonthHe = isMonthHeCheck(branch, monthBranch);
          targetYao.fuShenIsDayHe   = isDayHeCheck(branch, dayBranch);
        }
        break;
      }
    }
  }
}
