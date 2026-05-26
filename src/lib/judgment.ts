import type {
  YaoState, GanZhi, JudgmentText, SanHeResult,
  WangShuai, WorldYongRelationType, ComprehensiveVerdict,
  DongYaoAnalysis,
} from '../types';
import type { Category } from '../types';
import type { SixRelative } from '../data/constants';
import {
  CATEGORY_TO_RELATIVE, SHENG_MAP, KE_MAP, BRANCH_ELEMENT, BRANCH_LABEL,
  CHONG_MAP, JUE_DI, MU_KU,
} from '../data/constants';
import { getMonthScore, getDayScore } from '../data/scoreTables';
import { RELATION_INFO, COMPREHENSIVE_TABLE } from '../data/worldYongTable';

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

// 把host爻替换成"伏神视图"：所有与地支相关的字段都改用伏神数据，
// 同时不再视为动/暗动/入墓/有变爻，确保后续分析仅基于伏神本体。
function buildFuShenView(host: YaoState, ganzhi: GanZhi): YaoState {
  const branch = host.fuShenBranch!;
  const monthScore = getMonthScore(branch, ganzhi.monthBranch);
  const dayScore = getDayScore(branch, ganzhi.dayBranch);
  return {
    ...host,
    yaoBranch: branch,
    yaoElement: host.fuShenElement ?? '土',
    relative: host.fuShenRelative!,
    // 伏神是隐于飞神之下的独立爻：不属于世/应、不计动暗动、不入墓
    isWorldLine: false,
    isResponseLine: false,
    isMoving: false,
    isHidden: false,
    monthScore,
    dayScore,
    energyScore: parseFloat((monthScore + dayScore).toFixed(1)),
    isMonthXunKong: host.fuShenIsMonthXK ?? false,
    isDayXunKong: host.fuShenIsDayXK ?? false,
    isMonthPo: host.fuShenIsMonthPo ?? false,
    isDayPo: host.fuShenIsDayPo ?? false,
    isMonthHe: host.fuShenIsMonthHe ?? false,
    isDayHe: host.fuShenIsDayHe ?? false,
    tombType: null,
    changedBranch: undefined,
    changedElement: undefined,
    changedRelative: undefined,
    changedIsYang: undefined,
    changedEnergyScore: undefined,
    changedFlags: undefined,
    finalState: null,
    yaoBranchTombFill: null,
    changedBranchTombFill: null,
    isFuShenView: true,
    // 既然此视图就是伏神本身，原 fuShen* 字段清空以免重复
    fuShenBranch: undefined,
    fuShenElement: undefined,
    fuShenRelative: undefined,
    fuShenEnergyScore: undefined,
    fuShenIsMonthXK: undefined,
    fuShenIsDayXK: undefined,
    fuShenIsMonthPo: undefined,
    fuShenIsDayPo: undefined,
    fuShenIsMonthHe: undefined,
    fuShenIsDayHe: undefined,
  };
}

export function selectYongShen(
  yaos: YaoState[], category: Category, ganzhi: GanZhi,
): { yongShen: YaoState | null; yongShenList: YaoState[] } {
  const targetRelative: SixRelative = CATEGORY_TO_RELATIVE[category];
  // 1. 先在飞神中找
  let candidates = yaos.filter(y => y.relative === targetRelative);
  let fromFuShen = false;
  // 2. 飞神不见时退到伏神
  if (candidates.length === 0) {
    candidates = yaos.filter(y => y.fuShenRelative === targetRelative);
    fromFuShen = true;
  }
  if (candidates.length === 0) return { yongShen: null, yongShenList: [] };

  let picked: YaoState;
  if (candidates.length === 1) {
    picked = candidates[0];
  } else {
    const scored = candidates.map(y => ({ yao: y, score: scoreYao(y) }));
    scored.sort((a, b) => b.score - a.score);
    picked = scored[0].yao;
  }

  if (fromFuShen) {
    const view = buildFuShenView(picked, ganzhi);
    return { yongShen: view, yongShenList: [view] };
  }
  return { yongShen: picked, yongShenList: candidates };
}

// 月建得分说明文字（解读前缀加"地支+五行+爻"，如 "用神：子水爻 ..."）
function scoreDesc(branchLabel: string, monthScore: number, dayScore: number, label: string): string {
  const mDesc = monthScoreLabel(monthScore);
  const dDesc = dayScoreLabel(dayScore);
  const total = parseFloat((monthScore + dayScore).toFixed(1));
  const state = total > 0 ? '旺相' : total < 0 ? '衰败' : '中平';
  return `${label}：${branchLabel}爻 ${mDesc}（${monthScore > 0 ? '+' : ''}${monthScore}），${dDesc}（${dayScore > 0 ? '+' : ''}${dayScore}），先天能量${total > 0 ? '+' : ''}${total}，${state}`;
}

// 伏神专用先天能量描述：开头直接"伏神X爻 ..."（无冒号），结尾用句号衔接后续伏神说明
function scoreDescFu(branchLabel: string, monthScore: number, dayScore: number, suffix: string): string {
  const mDesc = monthScoreLabel(monthScore);
  const dDesc = dayScoreLabel(dayScore);
  const total = parseFloat((monthScore + dayScore).toFixed(1));
  const state = total > 0 ? '旺相' : total < 0 ? '衰败' : '中平';
  const main = `伏神${branchLabel}爻 ${mDesc}（${monthScore > 0 ? '+' : ''}${monthScore}），${dDesc}（${dayScore > 0 ? '+' : ''}${dayScore}），先天能量${total > 0 ? '+' : ''}${total}，${state}`;
  return suffix ? `${main}。${suffix}` : main;
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

// 动爻具体子类型标签（按"化废/化旺"归类输出）
function describeChangedSubtypes(target: YaoState): string {
  const f = target.changedFlags;
  if (!f) return '';
  // 化废类（消耗能量）
  const feiLabels: string[] = [];
  if (f.isHuiTouKe) feiLabels.push('化回头克');
  if (f.isHuaTui)   feiLabels.push('化退神');
  if (f.isHuaPo)    feiLabels.push('化破');
  if (f.isHuaJue)   feiLabels.push('化绝');
  // 化旺类（增益能量）
  const wangLabels: string[] = [];
  if (f.isHuiTouSheng) wangLabels.push('化回头生');
  if (f.isHuaJin)      wangLabels.push('化进神');
  if (f.isHuaLinMonth) wangLabels.push('化临月建');
  if (f.isHuaLinDay)   wangLabels.push('化临日辰');
  // 反吟/伏吟（特殊提示，与化废/化旺无关）
  const extras: string[] = [];
  if (f.isFanYin) extras.push('反吟');
  if (f.isFuYin)  extras.push('伏吟');
  return [...feiLabels, ...wangLabels, ...extras].join('、');
}

type FinalConclusion = '旺相' | '衰败' | '平相';

function wsToConc(ws: WangShuai): FinalConclusion {
  return ws === '旺' ? '旺相' : ws === '衰' ? '衰败' : '平相';
}

// 当 target 自身就是 dongYaoAnalysis 选出的"重点动爻"时，
// 把焦点判定的旺衰直接当作动爻影响段的结论使用（避免"自身焦点却走完全循环判平相"）。
function findTargetFocusWangShuai(
  target: YaoState,
  analysis: DongYaoAnalysis | undefined,
  isWorld: boolean,
): { ws: WangShuai; label: string; reason: string } | null {
  if (!analysis) return null;
  // 伏神视图与飞神共享 position，但实体不同——伏神不能按本卦爻位匹配焦点
  if (target.isFuShenView) return null;
  switch (analysis.reason) {
    case 'single':
      if (analysis.singlePosition === target.position && analysis.singleWangShuai) {
        return {
          ws: analysis.singleWangShuai,
          label: '本卦唯一动爻',
          reason: analysis.singleReason ?? '',
        };
      }
      return null;
    case 'shengChain': {
      const hit = analysis.shengChains?.find(g => g.terminalPosition === target.position);
      if (hit) return { ws: hit.terminalWangShuai, label: '相生链终点', reason: hit.terminalReason };
      return null;
    }
    case 'energy': {
      const hit = analysis.energyFocus?.find(f => f.position === target.position);
      if (hit) return { ws: hit.wangShuai, label: '能量焦点', reason: hit.reason };
      return null;
    }
    case 'relation': {
      const rf = analysis.relationFocus;
      if (!rf) return null;
      const focus = rf.isYongChiShi
        ? rf.forWorld
        : (isWorld ? rf.forWorld : rf.forYong);
      if (focus && focus.position === target.position) {
        return { ws: focus.wangShuai, label: '关系焦点', reason: focus.reason };
      }
      return null;
    }
    default:
      return null;
  }
}

// 根据 dongYaoAnalysis.reason 选出参与"动爻影响"累加的源动爻集合。
// 与三合局类似——存在动动相生终点 / 能量焦点 / 关系焦点时，只让"重点动爻"贡献。
function chooseEffectSources(
  yaos: YaoState[],
  analysis: DongYaoAnalysis | undefined,
  isWorld: boolean,
): YaoState[] {
  const allActive = yaos.filter(y => y.isMoving || y.isHidden);
  if (!analysis) return allActive;
  switch (analysis.reason) {
    case 'shengChain': {
      const chains = analysis.shengChains ?? [];
      if (chains.length === 0) return allActive;
      // 多终点旺衰不一致时，只取旺的终点参与下方动爻影响分析；
      // 若没有旺的终点（全衰 / 全平），取全部终点（保持原行为）。
      const wang = chains.filter(c => c.terminalWangShuai === '旺');
      const picked = wang.length > 0 ? wang : chains;
      const positions = new Set(picked.map(c => c.terminalPosition));
      return yaos.filter(y => positions.has(y.position));
    }
    case 'energy': {
      const focusPos = new Set(analysis.energyFocus?.map(e => e.position) ?? []);
      return yaos.filter(y => focusPos.has(y.position));
    }
    case 'relation': {
      const rf = analysis.relationFocus;
      if (!rf) return allActive;
      // 用神持世时 forWorld 即代表合一目标
      const focus = rf.isYongChiShi
        ? rf.forWorld
        : (isWorld ? rf.forWorld : rf.forYong);
      return focus ? yaos.filter(y => y.position === focus.position) : [];
    }
    // single / sanhe / shengCycle / separate / none-active → 用全 active
    // （sanhe 在 getDongYaoEffectDetail 内仍走中神特殊分支）
    default:
      return allActive;
  }
}

// 同时返回叙述文本和最终结论（结论供综合判断模块使用）
function getDongYaoEffectDetail(
  target: YaoState, sources: YaoState[], sanHe: SanHeResult | null,
  analysis?: DongYaoAnalysis, isWorld?: boolean,
): { text: string; conclusion: FinalConclusion } {
  const parts: string[] = [];
  let conclusion: FinalConclusion | null = null;

  // 1) 本爻自身状态：动爻 化旺/化废 直接决定结论
  if (target.isMoving && target.finalState) {
    const stateDesc: Record<string, string> = {
      '化废': '能量逐渐减弱',
      '化旺': '能量逐渐增强',
      '化旺也化废': '能量变化巨大',
      '平动': '能量不变',
    };
    const subtypes = describeChangedSubtypes(target);
    const seg = subtypes
      ? `本爻为动爻，${subtypes}，属于动爻${target.finalState}，${stateDesc[target.finalState]}`
      : `本爻为动爻，${target.finalState}，${stateDesc[target.finalState]}`;
    parts.push(seg);
    if (target.finalState === '化旺') conclusion = '旺相';
    else if (target.finalState === '化废') conclusion = '衰败';
    // '化旺也化废' / '平动' 进入下方"其他动爻/暗动"分析
  } else if (target.isHidden) {
    parts.push('本爻为暗动');
  }

  // 1.x) target 自身已化旺/化废 → 结论已定，不再看其他动爻、三合局影响
  if (conclusion !== null) {
    parts.push(`最终：${conclusion}`);
    return { text: parts.join('；'), conclusion };
  }

  const targetEl = BRANCH_ELEMENT[target.yaoBranch];

  // 1.5) 若本爻自身即为动爻分析选出的「重点动爻」，且 step 1 未给出结论，
  //      直接采用焦点旺衰（避免"自身是焦点却走完循环误判平相"）。
  //      三合局场景由下方 step 2 单独处理，不在此分支重复。
  if (conclusion === null && !sanHe) {
    const focus = findTargetFocusWangShuai(target, analysis, isWorld ?? false);
    if (focus) {
      parts.push(`本爻自身即为「${focus.label}」（${focus.reason}）`);
      conclusion = wsToConc(focus.ws);
      parts.push(`最终：${conclusion}`);
      return { text: parts.join('；'), conclusion };
    }
  }

  // 2) 三合局存在时：只论中神。其相生克决定结论（若上一步未给出）
  if (sanHe) {
    let sanHeDelta = 0;
    // 中神若为本卦发动爻，需考虑其化废状态（与非三合分支规则一致）
    const zhongYao = sources.find(y => y.yaoBranch === sanHe.zhongShen
      && y.position !== target.position
      && (y.isMoving || y.isHidden));
    const zhongHuaPo = zhongYao?.isMoving && zhongYao.finalState === '化废';
    const zhongLabel = zhongYao
      ? (zhongYao.isMoving ? '中神（动爻）' : '中神（暗动）')
      : '中神';

    if (target.yaoBranch === sanHe.zhongShen) {
      parts.push(`本爻即为${sanHe.element}局三合之中神，处局之核心`);
      sanHeDelta = +1;
    } else {
      const zhongEl = BRANCH_ELEMENT[sanHe.zhongShen];
      if (SHENG_MAP[zhongEl] === targetEl) {
        if (zhongHuaPo) {
          parts.push(`存在${sanHe.element}局三合，${zhongLabel}${sanHe.zhongShen}生扶本爻，但${zhongLabel}化废，力量最终减弱`);
          sanHeDelta = -1;
        } else {
          parts.push(`存在${sanHe.element}局三合，${zhongLabel}${sanHe.zhongShen}生扶本爻，力量增强`);
          sanHeDelta = +1;
        }
      } else if (KE_MAP[zhongEl] === targetEl) {
        if (zhongHuaPo) {
          parts.push(`存在${sanHe.element}局三合，${zhongLabel}${sanHe.zhongShen}克制本爻，但${zhongLabel}化废，先减弱后增强`);
          sanHeDelta = +1;
        } else {
          parts.push(`存在${sanHe.element}局三合，${zhongLabel}${sanHe.zhongShen}克制本爻，力量减弱`);
          sanHeDelta = -1;
        }
      } else if (SHENG_MAP[targetEl] === zhongEl) {
        // 本爻 生 中神：仅动/暗动 target 算泄气；静爻/伏爻不能主动作用，不计 delta
        if (target.isMoving || target.isHidden) {
          parts.push(`存在${sanHe.element}局三合，本爻生中神${sanHe.zhongShen}，泄气`);
          sanHeDelta = -0.5;
        } else {
          parts.push(`存在${sanHe.element}局三合，本爻为${target.isFuShenView ? '伏神' : '静爻'}，不能主动作用于中神${sanHe.zhongShen}`);
        }
      } else if (KE_MAP[targetEl] === zhongEl) {
        // 本爻 克 中神：同上
        if (target.isMoving || target.isHidden) {
          parts.push(`存在${sanHe.element}局三合，本爻克中神${sanHe.zhongShen}，耗力`);
          sanHeDelta = -0.5;
        } else {
          parts.push(`存在${sanHe.element}局三合，本爻为${target.isFuShenView ? '伏神' : '静爻'}，不能主动作用于中神${sanHe.zhongShen}`);
        }
      } else {
        parts.push(`存在${sanHe.element}局三合，中神${sanHe.zhongShen}与本爻无直接生克`);
      }
    }
    if (conclusion === null) {
      conclusion = sanHeDelta > 0 ? '旺相' : sanHeDelta < 0 ? '衰败' : '平相';
    }
    parts.push(`最终：${conclusion}`);
    return { text: parts.join('；'), conclusion };
  }

  // 3) 无三合：若动爻结论已定（化旺/化废）则不再展开，否则按 8 条规则累加 sources 影响
  if (conclusion === null) {
    let delta = 0;
    const effects: string[] = [];
    for (const dy of sources) {
      if (!dy.isMoving && !dy.isHidden) continue;
      // 跳过 target 自身：伏神视图与飞神共享 position 但实体不同，
      // 伏神 target 时同位置的飞神作为独立动爻应参与生克分析。
      if (!target.isFuShenView && dy.position === target.position) continue;
      const dyEl = BRANCH_ELEMENT[dy.yaoBranch];
      const label = dy.isMoving ? '动爻' : '暗动';
      const dyIsFei = dy.finalState === '化废';

      if (SHENG_MAP[dyEl] === targetEl) {
        // 被动爻/暗动生
        if (dy.isMoving) {
          if (!dyIsFei) { delta += 1;  effects.push(`得${label}${dy.yaoBranch}生，且${label}未化废，力量最终增强`); }
          else          { delta -= 1;  effects.push(`得${label}${dy.yaoBranch}生，但${label}化废，力量最终减弱`); }
        } else {
          if (dy.energyScore > 0) { delta += 2;   effects.push(`得暗动${dy.yaoBranch}生，且暗动旺相，力量大大增强`); }
          else                    { delta += 0.5; effects.push(`得暗动${dy.yaoBranch}生，但暗动衰相，力量小小增强`); }
        }
      } else if (KE_MAP[dyEl] === targetEl) {
        // 被动爻/暗动克
        if (dy.isMoving) {
          if (!dyIsFei) { delta -= 1; effects.push(`被${label}${dy.yaoBranch}克，且${label}未化废，力量最终减弱`); }
          else          { delta += 1; effects.push(`被${label}${dy.yaoBranch}克，但${label}化废，先减弱后增强`); }
        } else {
          if (dy.energyScore > 0) { delta -= 2;   effects.push(`被暗动${dy.yaoBranch}克，且暗动旺相，力量大大减弱`); }
          else                    { delta -= 0.5; effects.push(`被暗动${dy.yaoBranch}克，但暗动衰相，力量小小减弱`); }
        }
      }
      // 注：静爻 / 伏爻 不能主动作用于动爻，target 生 dy / target 克 dy 不计 delta、不输出
    }
    if (effects.length > 0) parts.push(effects.join('；'));
    else if (!target.isMoving && !target.isHidden) parts.push('未受动爻明显影响');
    conclusion = delta > 0 ? '旺相' : delta < 0 ? '衰败' : '平相';
  }

  parts.push(`最终：${conclusion}`);
  return { text: parts.join('；'), conclusion };
}

// 把"旺相 / 衰败 / 平相"归一为旺衰；平相时回退到先天能量
function decideWangShuai(dongConc: FinalConclusion, preTianScore: number): WangShuai {
  if (dongConc === '旺相') return '旺';
  if (dongConc === '衰败') return '衰';
  // 平相 → 看先天能量
  if (preTianScore > 0) return '旺';
  if (preTianScore < 0) return '衰';
  return '平';
}

// 判定世用关系六分类
function classifyWorldYongRelation(
  yongShen: YaoState, worldLine: YaoState, isChiShi: boolean,
): WorldYongRelationType {
  if (isChiShi) return '用神持世';
  const yongEl = BRANCH_ELEMENT[yongShen.yaoBranch];
  const worldEl = BRANCH_ELEMENT[worldLine.yaoBranch];
  if (SHENG_MAP[worldEl] === yongEl) return '世爻生用神';
  if (KE_MAP[worldEl] === yongEl)    return '世爻克用神';
  if (SHENG_MAP[yongEl] === worldEl) return '用神生世爻';
  if (KE_MAP[yongEl] === worldEl)    return '用神克世爻';
  return '比和';
}

// 旺/衰/平 → 表述
function wangShuaiText(ws: WangShuai): string {
  return ws === '旺' ? '旺相' : ws === '衰' ? '衰败' : '平相';
}

// 把六级 verdict 压成顶部 3 级徽章
function verdictBadge(v: ComprehensiveVerdict): '吉' | '凶' | '不吉' {
  if (v === '大吉' || v === '小吉' || v === '平吉') return '吉';
  if (v === '大凶' || v === '小凶' || v === '凶')   return '凶';
  return '不吉';
}

// ──────── 伏神补充算法 ────────
// 用神为伏神时的特殊判断流程：先看伏神有力 → 再看能否出伏 → 不能出伏看伏飞 / 能出伏走普通流程。

// 1) 伏神是否"有力"
//    无力条件：先天能量 ≤ 0；被日辰/月建旬空、墓、冲；伏神在日辰/月建是绝地。
function isFuShenYouLi(fu: YaoState, ganzhi: GanZhi): { ok: boolean; reason: string } {
  if (fu.energyScore <= 0) {
    return { ok: false, reason: `先天能量${fu.energyScore > 0 ? '+' : ''}${fu.energyScore}（≤0）` };
  }
  if (fu.isMonthXunKong) return { ok: false, reason: '被月建旬空' };
  if (fu.isDayXunKong)   return { ok: false, reason: '被日辰旬空' };
  if (fu.isMonthPo)      return { ok: false, reason: '被月建冲破' };
  if (fu.isDayPo)        return { ok: false, reason: '被日辰冲破' };
  // 墓库：伏神被月建/日辰墓库（伏神五行的墓地 == 月支或日支）
  const tombBranch = MU_KU[BRANCH_ELEMENT[fu.yaoBranch]];
  if (tombBranch && tombBranch === ganzhi.monthBranch) return { ok: false, reason: '被月建入墓' };
  if (tombBranch && tombBranch === ganzhi.dayBranch)   return { ok: false, reason: '被日辰入墓' };
  // 绝地：伏神五行的绝地 == 月支或日支
  const jueBranch = JUE_DI[BRANCH_ELEMENT[fu.yaoBranch]];
  if (jueBranch && jueBranch === ganzhi.monthBranch) return { ok: false, reason: '在月建是绝地' };
  if (jueBranch && jueBranch === ganzhi.dayBranch)   return { ok: false, reason: '在日辰是绝地' };
  return { ok: true, reason: '先天能量为正，且不被日辰或月建旬空、墓、绝、冲' };
}

// 2) 出伏判断（前提：有力）
//    满足以下任一即可出伏：
//      a) 日辰/月建/动爻 冲或克 飞神
//      b) 飞神旬空或月破
//      c) 伏神临年/月/日支
//      d) 飞神静爻能量衰 + 伏神能量>0
//      e) 飞神动爻最终衰（化废）+ 伏神能量>0
function canChuFu(
  fu: YaoState, fei: YaoState, ganzhi: GanZhi, activeYaos: YaoState[],
): { ok: boolean; reason: string } {
  const feiBranch = fei.yaoBranch;
  const feiEl = BRANCH_ELEMENT[feiBranch];

  // a) 日/月 冲飞神
  if (CHONG_MAP[feiBranch] === ganzhi.dayBranch)   return { ok: true, reason: `日辰${ganzhi.dayBranch}冲开飞神${feiBranch}` };
  if (CHONG_MAP[feiBranch] === ganzhi.monthBranch) return { ok: true, reason: `月建${ganzhi.monthBranch}冲开飞神${feiBranch}` };
  // a) 日/月 克飞神
  if (KE_MAP[BRANCH_ELEMENT[ganzhi.dayBranch]] === feiEl)   return { ok: true, reason: `日辰${ganzhi.dayBranch}克飞神${feiBranch}` };
  if (KE_MAP[BRANCH_ELEMENT[ganzhi.monthBranch]] === feiEl) return { ok: true, reason: `月建${ganzhi.monthBranch}克飞神${feiBranch}` };
  // a) 动爻（含暗动）冲或克飞神
  for (const dy of activeYaos) {
    if (CHONG_MAP[feiBranch] === dy.yaoBranch) {
      return { ok: true, reason: `${dy.isMoving ? '动爻' : '暗动'}${dy.yaoBranch}冲开飞神${feiBranch}` };
    }
    if (KE_MAP[BRANCH_ELEMENT[dy.yaoBranch]] === feiEl) {
      return { ok: true, reason: `${dy.isMoving ? '动爻' : '暗动'}${dy.yaoBranch}克飞神${feiBranch}` };
    }
  }

  // b) 飞神旬空或月破
  if (fei.isMonthXunKong || fei.isDayXunKong) return { ok: true, reason: `飞神${feiBranch}旬空` };
  if (fei.isMonthPo)                           return { ok: true, reason: `飞神${feiBranch}月破` };

  // c) 伏神临年/月/日支
  if (fu.yaoBranch === ganzhi.yearBranch)  return { ok: true, reason: `伏神${fu.yaoBranch}临年支` };
  if (fu.yaoBranch === ganzhi.monthBranch) return { ok: true, reason: `伏神${fu.yaoBranch}临月建` };
  if (fu.yaoBranch === ganzhi.dayBranch)   return { ok: true, reason: `伏神${fu.yaoBranch}临日辰` };

  // d) & e) 飞神衰 + 伏神能量>0
  if (fu.energyScore > 0) {
    if (fei.isMoving) {
      // 动爻：最终衰（化废）
      if (fei.finalState === '化废') {
        return { ok: true, reason: `飞神${feiBranch}动爻化废、能量衰，且伏神先天能量+${fu.energyScore}` };
      }
    } else if (!fei.isHidden) {
      // 静爻：先天能量 < 0 视为衰
      if (fei.energyScore < 0) {
        return { ok: true, reason: `飞神${feiBranch}静爻能量${fei.energyScore}（衰），且伏神先天能量+${fu.energyScore}` };
      }
    }
  }

  return { ok: false, reason: '未触发任何出伏条件' };
}

// 3) 伏飞关系（仅在不能出伏时使用）
type FuFeiKind = '飞生伏' | '飞克伏' | '伏生飞' | '伏克飞' | '伏飞比和';
function fuFeiRelation(
  fu: YaoState, fei: YaoState,
): { type: FuFeiKind; meaning: string; verdict: ComprehensiveVerdict } {
  const fuEl = BRANCH_ELEMENT[fu.yaoBranch];
  const feiEl = BRANCH_ELEMENT[fei.yaoBranch];
  if (SHENG_MAP[feiEl] === fuEl) {
    return { type: '飞生伏', meaning: '飞生伏：吉，易得贵人、机会，事成。', verdict: '小吉' };
  }
  if (KE_MAP[feiEl] === fuEl) {
    return { type: '飞克伏', meaning: '飞克伏：凶，阻力大、被压制、难成、有损。', verdict: '小凶' };
  }
  if (SHENG_MAP[fuEl] === feiEl) {
    return { type: '伏生飞', meaning: '伏生飞：平偏凶，付出多、耗力、回报少。', verdict: '平凶' };
  }
  if (KE_MAP[fuEl] === feiEl) {
    return { type: '伏克飞', meaning: '伏克飞：凶中带急，强行突破、易有纠纷、官非、破财。', verdict: '小凶' };
  }
  return { type: '伏飞比和', meaning: '伏飞五行比和，平。', verdict: '平' };
}

interface FuShenAnalysis {
  youLi: { ok: boolean; reason: string };
  chuFu: { ok: boolean; reason: string };
  feiShen: YaoState;
  fuFei: { type: FuFeiKind; meaning: string; verdict: ComprehensiveVerdict };
  preTianSuffix: string;  // 拼到先天能量末尾的说明
}

function buildFuShenAnalysis(
  fu: YaoState, yaos: YaoState[], ganzhi: GanZhi,
): FuShenAnalysis | null {
  // 飞神 = host 爻（与伏神视图相同 position）
  const fei = yaos.find(y => y.position === fu.position);
  if (!fei) return null;
  const activeYaos = yaos.filter(y => y.isMoving || y.isHidden);

  const youLi = isFuShenYouLi(fu, ganzhi);
  const chuFu = youLi.ok
    ? canChuFu(fu, fei, ganzhi, activeYaos)
    : { ok: false, reason: `由于${youLi.reason}，出伏"无力"，因此不能"出伏"。` };

  let preTianSuffix: string;
  if (!youLi.ok) {
    preTianSuffix = chuFu.reason;
  } else {
    // 有力 + 出伏说明
    const chuFuText = chuFu.ok
      ? `而且${chuFu.reason}，因此可以"出伏"。`
      : `但${chuFu.reason}，因此不能"出伏"。`;
    preTianSuffix = `${youLi.reason}，因此出伏"有力"。${chuFuText}`;
  }

  const fuFei = fuFeiRelation(fu, fei);
  return { youLi, chuFu, feiShen: fei, fuFei, preTianSuffix };
}

export function generateJudgment(
  yaos: YaoState[],
  worldLine: YaoState,
  yongShen: YaoState | null,
  ganzhi: GanZhi,
  sanHe: SanHeResult | null,
  dongYaoAnalysis?: DongYaoAnalysis,
): JudgmentText {
  // 用神持世：用神与世爻确实是同一爻。
  // 注意：伏神视图 不算持世——即便伏神所附飞神就是世爻，
  // 伏神 ≠ 飞神，不能视为用神持世。
  const isYongChiShi = !!yongShen
    && !yongShen.isFuShenView
    && yongShen.position === worldLine.position;

  // 伏神补充算法：用神为伏神时，先做"有力 → 能否出伏"判定
  const isFuYong = !!yongShen && yongShen.isFuShenView;
  const fuShenInfo = isFuYong ? buildFuShenAnalysis(yongShen!, yaos, ganzhi) : null;

  // 1. 先天能量
  let preTianYong: string;
  let preTianWorld: string;
  if (isYongChiShi) {
    preTianYong = '';
    preTianWorld = scoreDesc(
      BRANCH_LABEL[worldLine.yaoBranch],
      worldLine.monthScore, worldLine.dayScore, '世爻/用神',
    );
  } else {
    if (isFuYong && yongShen) {
      preTianYong = scoreDescFu(
        BRANCH_LABEL[yongShen.yaoBranch],
        yongShen.monthScore, yongShen.dayScore,
        fuShenInfo?.preTianSuffix ?? '',
      );
    } else {
      preTianYong = yongShen
        ? scoreDesc(
            BRANCH_LABEL[yongShen.yaoBranch],
            yongShen.monthScore, yongShen.dayScore, '用神',
          )
        : '用神：未找到用神（无对应六亲）';
    }
    preTianWorld = scoreDesc(
      BRANCH_LABEL[worldLine.yaoBranch],
      worldLine.monthScore, worldLine.dayScore, '世爻',
    );
  }

  // 2. 动爻影响——同时取回结论；按 dongYaoAnalysis 缩减影响源集合
  const worldSources = chooseEffectSources(yaos, dongYaoAnalysis, true);
  const yongSources = chooseEffectSources(yaos, dongYaoAnalysis, false);
  const worldDetail = getDongYaoEffectDetail(worldLine, worldSources, sanHe, dongYaoAnalysis, true);
  const yongDetail = yongShen
    ? getDongYaoEffectDetail(yongShen, yongSources, sanHe, dongYaoAnalysis, false)
    : null;
  let dongYaoYong: string;
  let dongYaoWorld: string;
  const worldLabel = BRANCH_LABEL[worldLine.yaoBranch];
  if (isYongChiShi) {
    dongYaoYong = '';
    dongYaoWorld = `世爻/用神：${worldLabel}爻 ${worldDetail.text}`;
  } else if (isFuYong && yongShen && fuShenInfo) {
    const yongBranchLabel = BRANCH_LABEL[yongShen.yaoBranch];
    if (fuShenInfo.chuFu.ok) {
      // 能出伏 → 走普通动爻影响分析，前面加说明
      dongYaoYong = yongDetail
        ? `伏神${yongBranchLabel}爻 由于伏神能出伏，因此以分析动爻与伏神关系为主。${yongDetail.text}`
        : `伏神${yongBranchLabel}爻 由于伏神能出伏，因此以分析动爻与伏神关系为主。`;
    } else {
      // 不能出伏 → 伏飞关系
      dongYaoYong = `伏神${yongBranchLabel}爻 由于伏神不能出伏，因此以分析伏飞关系为主。${fuShenInfo.fuFei.meaning}`;
    }
    dongYaoWorld = `世爻：${worldLabel}爻 ${worldDetail.text}`;
  } else {
    dongYaoYong = yongDetail && yongShen
      ? `用神：${BRANCH_LABEL[yongShen.yaoBranch]}爻 ${yongDetail.text}`
      : '用神：—';
    dongYaoWorld = `世爻：${worldLabel}爻 ${worldDetail.text}`;
  }

  // 3. 世/用神旺衰判定（先看动爻结论，平相回退到先天能量）
  const worldWS = decideWangShuai(worldDetail.conclusion, worldLine.energyScore);
  const yongWS = isYongChiShi
    ? worldWS
    : yongDetail
      ? decideWangShuai(yongDetail.conclusion, yongShen!.energyScore)
      : '平';

  // 4. 世用关系（含含义与本质）
  let worldYongRelation: JudgmentText['worldYongRelation'];
  let comprehensive: JudgmentText['comprehensive'];

  if (!yongShen) {
    worldYongRelation = { type: null, meaning: '', essence: '无用神，难以判断' };
    comprehensive = {
      worldWangShuai: worldWS, yongWangShuai: '平',
      statusLine: '本卦中，未找到用神（无对应六亲）',
      verdict: '平', explanation: '无用神可参，难以给出综合定性。',
    };
  } else if (isFuYong && fuShenInfo && !fuShenInfo.chuFu.ok) {
    // 用神为伏神且不能出伏 → 按伏飞关系 + 有力无力定吉凶
    const rel = fuShenInfo.fuFei;
    worldYongRelation = {
      type: null,
      meaning: rel.meaning,
      essence: '用神为伏神，不能"出伏"，根据伏飞关系和伏神有力无力状态定吉凶。',
    };
    if (!fuShenInfo.youLi.ok) {
      comprehensive = {
        worldWangShuai: worldWS, yongWangShuai: '平',
        statusLine: '本卦用神为伏神，出伏"无力"',
        verdict: '凶',
        explanation: '用神（伏神）：出伏"无力"，凶。',
      };
    } else {
      comprehensive = {
        worldWangShuai: worldWS, yongWangShuai: '平',
        statusLine: `本卦用神为伏神，出伏"有力"，但不能"出伏"，伏飞关系：${rel.type}`,
        verdict: rel.verdict,
        explanation: `用神（伏神）：出伏"有力"，但${rel.meaning}`,
      };
    }
  } else {
    const relType = classifyWorldYongRelation(yongShen, worldLine, isYongChiShi);
    const info = RELATION_INFO[relType];
    worldYongRelation = { type: relType, meaning: info.meaning, essence: info.essence };

    // 综合判断查表
    const combKey = `${worldWS}+${yongWS}` as keyof typeof COMPREHENSIVE_TABLE[typeof relType];
    let entry = COMPREHENSIVE_TABLE[relType][combKey];

    // 平/平 等表中没有的组合：回退到"接近"的组合
    if (!entry) {
      // 对世爻：平→衰更保守；用神持世且 平→衰
      const fallbackWorld: '旺' | '衰' = worldWS === '旺' ? '旺' : '衰';
      const fallbackYong: '旺' | '衰' = yongWS === '旺' ? '旺' : '衰';
      const fKey = `${fallbackWorld}+${fallbackYong}` as keyof typeof COMPREHENSIVE_TABLE[typeof relType];
      entry = COMPREHENSIVE_TABLE[relType][fKey];
    }

    const statusLine = isYongChiShi
      ? `本卦中，${wangShuaiText(worldWS)}（用神持世），${relType}`
      : `本卦中，世爻${wangShuaiText(worldWS)}，用神${wangShuaiText(yongWS)}，${relType}`;

    comprehensive = {
      worldWangShuai: worldWS,
      yongWangShuai: yongWS,
      statusLine,
      verdict: entry?.verdict ?? '平',
      explanation: entry?.explanation ?? '能量平和，事象平淡。',
    };
  }

  const verdict = verdictBadge(comprehensive.verdict);
  const verdictReason = comprehensive.explanation;

  return {
    preTianYong, preTianWorld,
    dongYaoYong, dongYaoWorld,
    isYongChiShi,
    worldYongRelation,
    comprehensive,
    verdict, verdictReason,
  };
}
