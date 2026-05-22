import type { YaoType, GanZhi, YaoState, HexagramResult, HexagramInput } from '../types';
import { BRANCH_ELEMENT, LIUSHEN_START, LIUSHEN_NAMES } from '../data/constants';
import { isYang, isMovingYao } from './divination';
import { findHexagram, calcChangedLines, calcRelative } from '../data/hexagrams';
import { getMonthScore, getDayScore } from '../data/scoreTables';
import { detectSpecialFlags } from './special';
import { detectChangedFlags, calcFinalState } from './changed';
import { checkAllTombs } from './tomb';
import { detectSanHe } from './sanhe';
import { selectYongShen, generateJudgment } from './judgment';

export function buildHexagramResult(input: HexagramInput, yaoCodes: YaoType[], ganzhi: GanZhi): HexagramResult {
  // 构建本卦阴阳线
  const originalLines = yaoCodes.map(isYang) as [0|1,0|1,0|1,0|1,0|1,0|1];
  const movingPositions = yaoCodes.map((c, i) => isMovingYao(c) ? i + 1 : -1).filter(p => p > 0);

  const originalHex = findHexagram(originalLines);
  if (!originalHex) throw new Error('无法找到对应卦象');

  // 变卦
  const changedLines = movingPositions.length > 0 ? calcChangedLines(originalLines, movingPositions) : null;
  const changedHex = changedLines ? findHexagram(changedLines) : undefined;

  // 六神分配（从一爻到六爻，根据日干）
  const startLiuShen = LIUSHEN_START[ganzhi.dayStem] ?? 0;
  const liuShens = Array.from({length: 6}, (_, i) => LIUSHEN_NAMES[(startLiuShen + i) % 6]);

  // 构建每爻状态
  const yaos: YaoState[] = yaoCodes.map((code, idx) => {
    const position = (idx + 1) as 1|2|3|4|5|6;
    const yaoBranch = originalHex.branches[idx];
    const yaoElement = BRANCH_ELEMENT[yaoBranch];
    const isMoving = isMovingYao(code);
    const changedBranch = isMoving && changedHex ? changedHex.branches[idx] : undefined;
    const changedElement = changedBranch ? BRANCH_ELEMENT[changedBranch] : undefined;

    const monthScore = getMonthScore(yaoBranch, ganzhi.monthBranch);
    const dayScore = getDayScore(yaoBranch, ganzhi.dayBranch);
    const energyScore = parseFloat((monthScore + dayScore).toFixed(1));

    const relative = calcRelative(ganzhi.dayStem, yaoBranch);
    const liuShen = liuShens[idx];

    return {
      position,
      yaoBranch,
      yaoElement,
      isYangYao: originalLines[idx] === 1,
      relative,
      liuShen,
      isMoving,
      isHidden: false,
      changedBranch,
      changedElement,
      isWorldLine: position === originalHex.worldLine,
      isResponseLine: position === originalHex.responseLine,
      monthScore,
      dayScore,
      energyScore,
      // 特殊状态先置空，下面计算
      isMonthXunKong: false,
      isDayXunKong: false,
      isMonthPo: false,
      isDayPo: false,
      isMonthHe: false,
      isDayHe: false,
      tombType: null,
    };
  });

  // 计算特殊爻标注（旬空/月破/日破/暗动/月合/日合）
  detectSpecialFlags(yaos, ganzhi);

  // 计算变爻特殊状态
  for (const yao of yaos) {
    if (yao.isMoving && yao.changedBranch) {
      yao.changedFlags = detectChangedFlags(yao.yaoBranch, yao.changedBranch, ganzhi.monthBranch, ganzhi.dayBranch, yaos);
      yao.finalState = calcFinalState(yao.changedFlags);
    }
  }

  // 计算入墓
  checkAllTombs(yaos, ganzhi);

  // 三合局
  const sanHe = detectSanHe(yaos, ganzhi);

  // 用神
  const { yongShen, yongShenList } = selectYongShen(yaos, input.category);

  // 世爻
  const worldLine = yaos.find(y => y.isWorldLine) ?? yaos[0];

  // 吉凶判断
  const judgment = generateJudgment(yaos, worldLine, yongShen, ganzhi, sanHe);

  return {
    ganzhi,
    originalHexagram: originalHex,
    changedHexagram: changedHex,
    yaos,
    sanHe,
    yongShen,
    yongShenList,
    judgment,
  };
}
