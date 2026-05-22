import type { YaoState, GanZhi, JudgmentText, SanHeResult } from '../types';
import type { Category } from '../types';
import type { SixRelative } from '../data/constants';
import { CATEGORY_TO_RELATIVE, SHENG_MAP, KE_MAP, BRANCH_ELEMENT } from '../data/constants';

// 用神选取规则（打分）
function scoreYao(yao: YaoState): number {
  let score = 0;
  if (yao.isWorldLine || yao.isResponseLine) score += 5;
  if (yao.isMoving) score += 4;
  if (yao.isHidden) score += 3;
  if (yao.isMonthPo || yao.isDayPo || yao.isMonthXunKong || yao.isDayXunKong || yao.isMonthHe || yao.isDayHe) score += 2;
  if (yao.tombType) score += 1;
  return score;
}

export function selectYongShen(yaos: YaoState[], category: Category): { yongShen: YaoState | null; yongShenList: YaoState[] } {
  const targetRelative: SixRelative = CATEGORY_TO_RELATIVE[category];
  const candidates = yaos.filter(y => y.relative === targetRelative);
  if (candidates.length === 0) return { yongShen: null, yongShenList: [] };
  if (candidates.length === 1) return { yongShen: candidates[0], yongShenList: candidates };
  const scored = candidates.map(y => ({ yao: y, score: scoreYao(y) }));
  scored.sort((a, b) => b.score - a.score);
  return { yongShen: scored[0].yao, yongShenList: scored.map(s => s.yao) };
}

// 月建得分说明文字
function scoreDesc(monthScore: number, dayScore: number, label: string): string {
  const mDesc = monthScoreLabel(monthScore);
  const dDesc = dayScoreLabel(dayScore);
  const total = parseFloat((monthScore + dayScore).toFixed(1));
  const state = total > 0 ? '旺相' : total < 0 ? '衰败' : '中平';
  return `${label}：${mDesc}（${monthScore > 0 ? '+' : ''}${monthScore}），${dDesc}（${dayScore > 0 ? '+' : ''}${dayScore}），先天能量${total > 0 ? '+' : ''}${total}，${state}`;
}

function monthScoreLabel(s: number): string {
  if (s === 2) return '得月建临扶';
  if (s === 1) return '得月建生扶';
  if (s === 0.5) return '得月建平合';
  if (s === -0.1) return '与月建休囚';
  if (s === -0.5) return '得月建克合';
  if (s === -1) return '得月建所克';
  if (s === -2) return '得月建冲破';
  return `月建得分${s}`;
}

function dayScoreLabel(s: number): string {
  if (s === 2) return '得日辰临扶';
  if (s === 1) return '得日辰相生';
  if (s === 0.5) return '得日辰平合';
  if (s === 0) return '与日辰没关系';
  if (s === -0.5) return '得日辰克合';
  if (s === -1) return '得日辰所克';
  if (s === -2) return '被日辰冲破';
  return `日辰得分${s}`;
}

function getDongYaoEffect(target: YaoState, allYaos: YaoState[], sanHe: SanHeResult | null): string {
  if (target.isMoving && target.finalState) {
    const stateDesc: Record<string, string> = {
      '化废': '能量逐渐减弱',
      '化旺': '能量逐渐增强',
      '化旺也化废': '能量变化巨大',
      '平动': '能量不变',
    };
    return `本爻为动爻，${stateDesc[target.finalState]}`;
  }

  if (target.isHidden) {
    return '本爻为暗动';
  }

  // 被动爻/暗动影响
  const targetEl = BRANCH_ELEMENT[target.yaoBranch];
  const effects: string[] = [];

  // 三合局情况：只论中神
  if (sanHe && allYaos.filter(y => y.isMoving || y.isHidden).length >= 2) {
    const zhongYao = allYaos.find(y => y.yaoBranch === sanHe.zhongShen && (y.isMoving || y.isHidden));
    if (zhongYao) {
      const zhongEl = BRANCH_ELEMENT[zhongYao.yaoBranch];
      if (SHENG_MAP[zhongEl] === targetEl) {
        effects.push(`存在${sanHe.element}局三合，中神${sanHe.zhongShen}生扶，力量增强`);
      } else if (KE_MAP[zhongEl] === targetEl) {
        effects.push(`存在${sanHe.element}局三合，中神${sanHe.zhongShen}克制，力量减弱`);
      } else {
        effects.push(`存在${sanHe.element}局三合，中神${sanHe.zhongShen}与本爻无直接生克关系`);
      }
    }
    return effects.join('；') || '无明显动爻影响';
  }

  for (const dy of allYaos) {
    if (!dy.isMoving && !dy.isHidden) continue;
    if (dy.position === target.position) continue;
    const dyEl = BRANCH_ELEMENT[dy.yaoBranch];
    const label = dy.isMoving ? '动爻' : '暗动';
    const notFei = dy.finalState !== '化废';

    if (SHENG_MAP[dyEl] === targetEl) {
      if (dy.isMoving) {
        effects.push(notFei ? `得${label}${dy.yaoBranch}生，且${label}未化废，力量最终增强` : `得${label}${dy.yaoBranch}生，但${label}化废，力量最终减弱`);
      } else {
        const strength = dy.energyScore > 0 ? '大大' : '小小';
        effects.push(`得暗动${dy.yaoBranch}生，且暗动${dy.energyScore > 0 ? '旺相' : '衰相'}，力量${strength}增强`);
      }
    } else if (KE_MAP[dyEl] === targetEl) {
      if (dy.isMoving) {
        effects.push(notFei ? `被${label}${dy.yaoBranch}克，且${label}未化废，力量最终减弱` : `被${label}${dy.yaoBranch}克，但${label}化废，先减弱后增强`);
      } else {
        const strength = dy.energyScore > 0 ? '大大' : '小小';
        effects.push(`被暗动${dy.yaoBranch}克，且暗动${dy.energyScore > 0 ? '旺相' : '衰相'}，力量${strength}减弱`);
      }
    }
  }

  return effects.length > 0 ? effects.join('；') : '未受动爻明显影响';
}

export function generateJudgment(
  yaos: YaoState[],
  worldLine: YaoState,
  yongShen: YaoState | null,
  _ganzhi: GanZhi,
  sanHe: SanHeResult | null
): JudgmentText {
  // 1. 先天状态
  const worldTianStatus = scoreDesc(worldLine.monthScore, worldLine.dayScore, '世爻');
  const yongTianStatus = yongShen
    ? scoreDesc(yongShen.monthScore, yongShen.dayScore, '用神')
    : '用神：未找到用神（无对应六亲）';
  const preTianStatus = `${yongTianStatus}；${worldTianStatus}`;

  // 2. 动爻关系
  const yongEffect = yongShen ? getDongYaoEffect(yongShen, yaos, sanHe) : '';
  const worldEffect = getDongYaoEffect(worldLine, yaos, sanHe);
  const dongYaoRelation = [
    yongShen ? `用神：${yongEffect}` : '',
    `世爻：${worldEffect}`,
  ].filter(Boolean).join('；');

  // 3. 世用关系
  let verdict: '吉' | '凶' | '不吉' = '不吉';
  let verdictReason = '';
  let worldYongRelation = '';

  if (!yongShen) {
    verdictReason = '无用神，难以判断';
    verdict = '不吉';
    worldYongRelation = verdictReason;
  } else {
    const yongEl = BRANCH_ELEMENT[yongShen.yaoBranch];
    const worldEl = BRANCH_ELEMENT[worldLine.yaoBranch];
    const yongWang = yongShen.energyScore > 0;
    const worldWang = worldLine.energyScore > 0;

    if (SHENG_MAP[yongEl] === worldEl) {
      // 用神生世爻
      if (yongWang) { verdict = '吉'; verdictReason = '用神生世爻，且用神旺相'; }
      else { verdict = '凶'; verdictReason = '用神生世爻，但用神衰败，力量不足'; }
    } else if (KE_MAP[yongEl] === worldEl) {
      // 用神克世爻
      if (worldWang) { verdict = '吉'; verdictReason = '用神克世爻，但世爻旺相能承'; }
      else { verdict = '凶'; verdictReason = '用神克世爻，且世爻衰败'; }
    } else if (SHENG_MAP[worldEl] === yongEl) {
      // 世爻生用神（泄世）
      if (yongWang && worldWang) { verdict = '吉'; verdictReason = '世爻生用神，双方旺相'; }
      else { verdict = '不吉'; verdictReason = '世爻生用神，用神或世爻有衰'; }
    } else if (KE_MAP[worldEl] === yongEl) {
      // 世爻克用神
      verdict = '凶'; verdictReason = '世爻克用神，不利所求之事';
    } else {
      // 无生克或持世
      if (yongWang && worldWang) { verdict = '吉'; verdictReason = '用神旺相，世爻旺相，事可成'; }
      else if (!yongWang) { verdict = '不吉'; verdictReason = '用神衰败，难以得力'; }
      else { verdict = '不吉'; verdictReason = '世爻衰败，力量不足'; }
    }
    worldYongRelation = `世用关系：${verdictReason}，综合判断：${verdict}`;
  }

  return { preTianStatus, dongYaoRelation, worldYongRelation, verdict, verdictReason };
}
