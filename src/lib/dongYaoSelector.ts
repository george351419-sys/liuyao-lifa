// 多动爻选取算法。
// 三种 mode（average / energy / relation）共享前三档判断：
//   1) 无动爻 / 暗动 → none-active
//   2) 只有一个动爻 → single
//   3) 多动爻 + 三合局 → sanhe（以中神为重点）
//   4) 多动爻 + 动动相生 → shengChain（以最终被生爻为重点）
// 仅当走到第 5 档（多动爻无三合无相生）时三种 mode 分叉：
//   - average：每个生克的动爻分别分析（separate）
//   - energy：按能量级别（化旺 > 平动 > 化废）+ 同级先天能量排序，
//             最高级 ≥ 2 个且能量 > 0 时取前两名同时分析
//   - relation：对世爻与用神分别按 六合 > 相冲 > 被生 > 被克 > 主生 > 主克
//               选取最高级关系的动爻；同级看动爻能量

import type {
  YaoState, GanZhi, SanHeResult, DongYaoAnalysis,
  DongYaoSelectionMode, WangShuai, ShengChain,
  DongYaoEnergyLevel, EnergyFocusYao,
  DongYaoRelationKind, RelationFocusEntry,
} from '../types';
import {
  BRANCH_ELEMENT, SHENG_MAP, KE_MAP, HE_MAP, CHONG_MAP,
} from '../data/constants';

function activeLabel(y: YaoState): string {
  return y.isMoving ? '动爻' : '暗动';
}

// 用于"未化旺也未化废"时的精确描述：动爻 → "动爻平动"，暗动 → "暗动"
function dongOrAn(y: YaoState): string {
  if (y.isMoving) return '动爻平动';
  if (y.isHidden) return '暗动';
  return '静爻';
}

// 重点爻平动 / 暗动 时按先天能量回退
function fallbackByEnergy(score: number): WangShuai {
  if (score > 0) return '旺';
  if (score < 0) return '衰';
  return '平';
}

// 单个动爻自身的旺衰判定（不考虑链上下游）
// 依据 calcFinalState 的归并结果：
//   '化旺' → 旺；'化废' → 衰；'化旺也化废' / '平动' → null（走后续 fallback）
// 理由文本按 changedFlags 列出具体子类型，便于阅读。
function wangShuaiBySelf(y: YaoState): { ws: WangShuai; reason: string } | null {
  if (!y.isMoving || !y.finalState) return null;
  const f = y.changedFlags;

  if (y.finalState === '化旺') {
    const subs: string[] = [];
    if (f?.isHuiTouSheng) subs.push('化回头生');
    if (f?.isHuaJin)      subs.push('化进神');
    if (f?.isHuaLinMonth) subs.push('化临月建');
    if (f?.isHuaLinDay)   subs.push('化临日辰');
    const label = subs.length > 0 ? subs.join('、') : '化旺';
    return { ws: '旺', reason: `${y.yaoBranch} ${label}，能量增强，定为旺相` };
  }
  if (y.finalState === '化废') {
    const subs: string[] = [];
    if (f?.isHuiTouKe) subs.push('化回头克');
    if (f?.isHuaJue)   subs.push('化绝');
    if (f?.isHuaPo)    subs.push('化破');
    if (f?.isHuaTui)   subs.push('化退神');
    if (f?.isHuaMonthXunKong || f?.isHuaDayXunKong) subs.push('化空');
    const label = subs.length > 0 ? subs.join('、') : '化废';
    return { ws: '衰', reason: `${y.yaoBranch} ${label}，能量减弱，定为衰败` };
  }
  // '化旺也化废' 视为能量变化巨大 → 按平动后续判断；'平动' → 同样
  return null;
}

// 单动爻：旺衰按 化旺/化废，平/暗动按先天能量
function judgeSingle(y: YaoState): { ws: WangShuai; reason: string } {
  const self = wangShuaiBySelf(y);
  if (self) return self;
  const ws = fallbackByEnergy(y.energyScore);
  return {
    ws,
    reason: `${y.yaoBranch} ${dongOrAn(y)}，先天能量${y.energyScore > 0 ? '+' : ''}${y.energyScore}，定为${ws === '旺' ? '旺相' : ws === '衰' ? '衰败' : '平相'}`,
  };
}

// 三合中神旺衰：化旺/化废 直接定；平 → 默认得三合局能量旺
function judgeZhongShen(
  zhongYao: YaoState | undefined,
  sanHe: SanHeResult,
): { ws: WangShuai; reason: string } {
  if (zhongYao) {
    const self = wangShuaiBySelf(zhongYao);
    if (self) return self;
    return {
      ws: '旺',
      reason: `${sanHe.zhongShen} ${dongOrAn(zhongYao)}，默认得三合${sanHe.element}局能量，定为旺相`,
    };
  }
  // 中神在卦上没有对应的发动爻（条件 2/3 由变爻补足三支的情形）
  return {
    ws: '旺',
    reason: `${sanHe.zhongShen} 不属本卦发动爻，但三合${sanHe.element}局成立，默认得三合局能量，定为旺相`,
  };
}

// 动动相生链终点旺衰：化旺/化废 直接定；平动 → 看所有直接前驱
//   · 任一前驱未化废 → 默认旺
//   · 所有前驱都化废 → 回退本爻先天能量
function judgeChainTerminal(
  terminal: YaoState,
  directPreds: YaoState[],
): { ws: WangShuai; reason: string } {
  const self = wangShuaiBySelf(terminal);
  if (self) return self;

  const nonHuaPo = directPreds.filter(p => !(p.isMoving && p.finalState === '化废'));
  if (nonHuaPo.length > 0) {
    const names = nonHuaPo.map(p => p.yaoBranch).join('、');
    return {
      ws: '旺',
      reason: `${terminal.yaoBranch} ${dongOrAn(terminal)}，但链上前驱 ${names} 未化废、生力到位，默认定为旺相`,
    };
  }
  // 所有前驱都化废 → 回退到终点自身先天能量
  const allNames = directPreds.map(p => p.yaoBranch).join('、');
  const ws = fallbackByEnergy(terminal.energyScore);
  return {
    ws,
    reason: `${terminal.yaoBranch} ${dongOrAn(terminal)}，且链上前驱（${allNames}）均化废、生力受损，回退看终点先天能量${terminal.energyScore > 0 ? '+' : ''}${terminal.energyScore}，定为${ws === '旺' ? '旺相' : ws === '衰' ? '衰败' : '平相'}`,
  };
}

// 检测 active 中是否存在「相生闭环」。
// 由于五行相生周期为 5（木→火→土→金→水→木），active 中只要 5 个元素都齐
// （木/火/土/金/水 至少各一个动爻或暗动）就构成 sheng cycle。
// 返回闭环代表序列（每个元素取位置升序的第一爻），无闭环返回 null。
function findShengCycle(active: YaoState[]): YaoState[] | null {
  const ELEMENTS = ['木', '火', '土', '金', '水'];
  const byElement: Record<string, YaoState[]> = {};
  for (const y of active) {
    const e = BRANCH_ELEMENT[y.yaoBranch];
    if (!byElement[e]) byElement[e] = [];
    byElement[e].push(y);
  }
  if (!ELEMENTS.every(e => (byElement[e]?.length ?? 0) > 0)) return null;
  // 每个元素取位置升序首爻，作为闭环代表
  return ELEMENTS.map(e => [...byElement[e]].sort((a, b) => a.position - b.position)[0]);
}

// 在 active 集合中查找所有「动动相生终点分组」。
// 每个终点 = 在 active 中存在前驱（被生）、且无后继（不再生别人）的爻；
// 同一终点的多个直接前驱各自回溯一条最长上行链（共享终点）。
// 若 active 集合形成完整 5 行环路，则无确定终点 → 返回空数组。
function findShengChains(active: YaoState[]): {
  terminal: YaoState;
  directPreds: YaoState[];        // 终点的所有直接前驱（用于旺衰判定）
  chainYaosList: YaoState[][];     // 多条独立上行链，每条含终点
}[] {
  if (active.length < 2) return [];

  // 构图：对每对 (a, b)，若 elem(a) 生 elem(b)，加边 a → b
  const predecessors = new Map<number, YaoState[]>();
  const successors = new Map<number, YaoState[]>();
  for (const y of active) {
    predecessors.set(y.position, []);
    successors.set(y.position, []);
  }
  for (const a of active) {
    for (const b of active) {
      if (a.position === b.position) continue;
      const ea = BRANCH_ELEMENT[a.yaoBranch];
      const eb = BRANCH_ELEMENT[b.yaoBranch];
      if (SHENG_MAP[ea] === eb) {
        successors.get(a.position)!.push(b);
        predecessors.get(b.position)!.push(a);
      }
    }
  }

  // 终点候选：有前驱（被生）、无后继（不再生别人）
  const terminals = active.filter(
    y => predecessors.get(y.position)!.length > 0
      && successors.get(y.position)!.length === 0,
  );

  const results: { terminal: YaoState; directPreds: YaoState[]; chainYaosList: YaoState[][] }[] = [];
  for (const term of terminals) {
    const directPreds = predecessors.get(term.position)!;
    // 对每个直接前驱单独回溯一条最长上行链，组成完整链：[...回溯到根, term]
    const chainYaosList: YaoState[][] = [];
    for (const pred of directPreds) {
      const upChain = traceLongestChain(pred, predecessors);
      chainYaosList.push([...upChain, term]);
    }
    // 同终点多条链按起点位置升序
    chainYaosList.sort((a, b) => a[0].position - b[0].position);
    if (chainYaosList.length > 0) {
      results.push({ terminal: term, directPreds, chainYaosList });
    }
  }

  // 按终点爻位升序
  results.sort((a, b) => a.terminal.position - b.terminal.position);
  return results;
}

// ─── 能量优先 ──────────────────────────────────────────────────
// 能量级别：化旺(3) > 平动/暗动/化旺也化废(2) > 化废(1)
function energyLevelOf(y: YaoState): DongYaoEnergyLevel {
  if (y.isMoving && y.finalState === '化旺') return '化旺';
  if (y.isMoving && y.finalState === '化废') return '化废';
  return '平动';
}

function energyLevelRank(lv: DongYaoEnergyLevel): number {
  return lv === '化旺' ? 3 : lv === '平动' ? 2 : 1;
}

// 对 active 集合按 (level desc, energyScore desc, position asc) 排序
function sortByEnergy(active: YaoState[]): YaoState[] {
  return [...active].sort((a, b) => {
    const la = energyLevelRank(energyLevelOf(a));
    const lb = energyLevelRank(energyLevelOf(b));
    if (la !== lb) return lb - la;
    if (a.energyScore !== b.energyScore) return b.energyScore - a.energyScore;
    return a.position - b.position;
  });
}

function toEnergyFocusYao(y: YaoState): EnergyFocusYao {
  const { ws, reason } = judgeSingle(y);
  return {
    position: y.position,
    branch: y.yaoBranch,
    level: energyLevelOf(y),
    energyScore: y.energyScore,
    wangShuai: ws,
    reason,
  };
}

// ─── 关系优先 ──────────────────────────────────────────────────
// 关系等级：六合(6) > 相冲(5) > 被生(4) > 被克(3) > 主生(2) > 主克(1) > 无(0)
function relationOf(yao: YaoState, target: YaoState): DongYaoRelationKind | null {
  if (yao.position === target.position) return null; // 不与自身比较
  const yb = yao.yaoBranch;
  const tb = target.yaoBranch;
  if (HE_MAP[tb] === yb) return '六合';
  if (CHONG_MAP[tb] === yb) return '相冲';
  const ye = BRANCH_ELEMENT[yb];
  const te = BRANCH_ELEMENT[tb];
  if (SHENG_MAP[ye] === te) return '被生'; // 动爻生 target
  if (KE_MAP[ye] === te)   return '被克'; // 动爻克 target
  if (SHENG_MAP[te] === ye) return '主生'; // target 生动爻
  if (KE_MAP[te] === ye)    return '主克'; // target 克动爻
  return null;
}

function relationRank(r: DongYaoRelationKind): number {
  switch (r) {
    case '六合': return 6;
    case '相冲': return 5;
    case '被生': return 4;
    case '被克': return 3;
    case '主生': return 2;
    case '主克': return 1;
  }
}

// 为单个目标（世爻 或 用神）选取重点动爻
function pickRelationFocus(
  active: YaoState[],
  target: YaoState,
  targetLabel: string,
): RelationFocusEntry | null {
  const scored = active
    .map(y => ({ yao: y, rel: relationOf(y, target) }))
    .filter((x): x is { yao: YaoState; rel: DongYaoRelationKind } => x.rel !== null);
  if (scored.length === 0) return null;
  // 先按关系等级取最高
  scored.sort((a, b) => relationRank(b.rel) - relationRank(a.rel));
  const topRank = relationRank(scored[0].rel);
  const topCandidates = scored.filter(x => relationRank(x.rel) === topRank);
  // 同级别 ≥ 2 个 → 按能量排序取最高
  const sorted = sortByEnergy(topCandidates.map(x => x.yao));
  const winner = sorted[0];
  const relation = scored.find(x => x.yao.position === winner.position)!.rel;
  const { ws, reason } = judgeSingle(winner);
  return {
    position: winner.position,
    branch: winner.yaoBranch,
    relation,
    level: energyLevelOf(winner),
    energyScore: winner.energyScore,
    wangShuai: ws,
    reason: `（${targetLabel}）${reason}`,
  };
}

// 关系优先呈现文字
function relationDescPart(target: '用神' | '世爻' | '世爻/用神', entry: RelationFocusEntry): string {
  // 句式参考 spec："A 爻六合用神"、"世爻被 B 爻生"
  const verbMap: Record<DongYaoRelationKind, string> = {
    '六合': `六合${target}`,
    '相冲': `相冲${target}`,
    '被生': `生${target}`,        // 动爻生目标
    '被克': `克${target}`,        // 动爻克目标
    '主生': `被${target}生`,      // 目标生动爻
    '主克': `被${target}克`,      // 目标克动爻
  };
  return `${entry.branch}（第${entry.position}爻）${verbMap[entry.relation]}，因此分析${target}时着重使用此爻`;
}

// 从终点向上回溯最长链。多前驱时按"前驱链最长 → 位置最低"挑选。
function traceLongestChain(
  terminal: YaoState,
  predecessors: Map<number, YaoState[]>,
): YaoState[] {
  // 记忆化：position → 以该爻为终点的最长链
  const memo = new Map<number, YaoState[]>();
  function dfs(node: YaoState, visiting: Set<number>): YaoState[] {
    if (memo.has(node.position)) return memo.get(node.position)!;
    if (visiting.has(node.position)) return [node]; // 防环
    visiting.add(node.position);
    const preds = predecessors.get(node.position) ?? [];
    let best: YaoState[] = [node];
    for (const p of preds) {
      const sub = dfs(p, visiting);
      const cand = [...sub, node];
      if (cand.length > best.length
        || (cand.length === best.length && sub[0].position < best[0].position)) {
        best = cand;
      }
    }
    visiting.delete(node.position);
    memo.set(node.position, best);
    return best;
  }
  return dfs(terminal, new Set());
}

export function computeDongYaoAnalysis(
  yaos: YaoState[],
  sanHe: SanHeResult | null,
  _ganzhi: GanZhi,
  mode: DongYaoSelectionMode = 'average',
  worldLine?: YaoState,
  yongShen?: YaoState | null,
): DongYaoAnalysis {
  const active = yaos.filter(y => y.isMoving || y.isHidden);

  // 0) 无动爻 / 暗动
  if (active.length === 0) {
    return {
      mode,
      reason: 'none-active',
      description: '本卦无动爻、无暗动。',
    };
  }

  // 1) 只有一个动爻（或暗动）
  if (active.length === 1) {
    const only = active[0];
    const { ws, reason } = judgeSingle(only);
    return {
      mode,
      reason: 'single',
      description: `由于只有一个${activeLabel(only)}（第${only.position}爻 ${only.yaoBranch}），因此着重分析该爻的影响。`,
      singlePosition: only.position,
      singleBranch: only.yaoBranch,
      singleWangShuai: ws,
      singleReason: reason,
    };
  }

  // 2) 多动爻：先看三合局
  if (sanHe) {
    const zhongYao = yaos.find(y => y.yaoBranch === sanHe.zhongShen
      && (y.isMoving || y.isHidden));
    const { ws, reason } = judgeZhongShen(zhongYao, sanHe);
    return {
      mode,
      reason: 'sanhe',
      description: `由于有多个动爻（含暗动），且存在三合${sanHe.element}局，因此着重分析中神 ${sanHe.zhongShen} 的影响。`,
      sanHeElement: sanHe.element,
      sanHeZhongShenBranch: sanHe.zhongShen,
      sanHeZhongShenPosition: zhongYao?.position,
      sanHeZhongShenWangShuai: ws,
      sanHeZhongShenReason: reason,
    };
  }

  // 3) 动动相生
  const chainHits = findShengChains(active);
  if (chainHits.length > 0) {
    const shengChains: ShengChain[] = chainHits.map(({ terminal, directPreds, chainYaosList }) => {
      const { ws, reason } = judgeChainTerminal(terminal, directPreds);
      return {
        terminalPosition: terminal.position,
        terminalBranch: terminal.yaoBranch,
        terminalWangShuai: ws,
        terminalReason: reason,
        chains: chainYaosList.map(chainYaos => ({
          positions: chainYaos.map(y => y.position),
          branches: chainYaos.map(y => y.yaoBranch),
        })),
      };
    });
    // 描述里把所有终点的所有链路平铺列出
    const allChainTexts = shengChains.flatMap(g =>
      g.chains.map(c => c.branches.join(' → ')),
    );
    const descPrefix = `由于有多个动爻（含暗动），且存在动动相生（${allChainTexts.join('；')}）`;
    const uniqueTerminals = shengChains.map(g => g.terminalBranch);
    const descSuffix = uniqueTerminals.length === 1
      ? `，因此优先分析最终被生的动爻（${uniqueTerminals[0]}）。`
      : `，因此优先分析各链最终被生的动爻（${uniqueTerminals.join('、')}）。`;
    return {
      mode,
      reason: 'shengChain',
      description: descPrefix + descSuffix,
      shengChains,
    };
  }

  // 3.5) 相生闭环（五行齐全）：承认存在动动相生，但各爻长度一致 → 分别分析
  const cycleRepresentative = findShengCycle(active);
  if (cycleRepresentative) {
    // 按位置升序排列所有参与的动爻
    const participants = [...active]
      .sort((a, b) => a.position - b.position)
      .map(y => ({
        position: y.position,
        branch: y.yaoBranch,
        element: BRANCH_ELEMENT[y.yaoBranch],
      }));
    // 元素闭环序列：以代表爻顺序展示，最后回到起点
    const elementChain = [
      ...cycleRepresentative.map(y => BRANCH_ELEMENT[y.yaoBranch]),
      BRANCH_ELEMENT[cycleRepresentative[0].yaoBranch],
    ];
    return {
      mode,
      reason: 'shengCycle',
      description: `由于有多个动爻（含暗动），存在动动相生（${elementChain.join('→')} 构成相生闭环），各爻在环中长度一致，因此对每个动爻分别分析。`,
      shengCycle: { elementChain, participants },
    };
  }

  // 4) 多动爻 + 无三合 + 无相生 → 按 mode 分叉

  // 4a) 能量优先
  if (mode === 'energy') {
    const sorted = sortByEnergy(active);
    const topLevel = energyLevelOf(sorted[0]);
    const topGroup = sorted.filter(y => energyLevelOf(y) === topLevel);
    const useTwo = topGroup.length >= 2
      && topGroup[0].energyScore > 0
      && topGroup[1].energyScore > 0;
    const picks = useTwo ? topGroup.slice(0, 2) : [sorted[0]];
    const energyFocus = picks.map(toEnergyFocusYao);
    const description = useTwo
      ? `由于不存在三合局和动动相生，且 ${energyFocus[0].branch}（第${energyFocus[0].position}爻）和 ${energyFocus[1].branch}（第${energyFocus[1].position}爻）能量接近，因此同时选取这两个动爻着重分析。`
      : `由于不存在三合局和动动相生，因此选取能量最高的一个动爻（${energyFocus[0].branch}）着重分析。`;
    return {
      mode,
      reason: 'energy',
      description,
      energyFocus,
    };
  }

  // 4b) 关系优先
  if (mode === 'relation') {
    const isYongChiShi = !!yongShen
      && !yongShen.isFuShenView
      && !!worldLine
      && yongShen.position === worldLine.position;

    // 持世：世爻与用神同一爻，只算一次
    let forWorld: RelationFocusEntry | null = null;
    let forYong: RelationFocusEntry | null = null;
    let worldEmpty: string | undefined;
    let yongEmpty: string | undefined;

    if (isYongChiShi && worldLine) {
      forWorld = pickRelationFocus(active, worldLine, '世爻/用神');
      if (!forWorld) worldEmpty = '世爻/用神 与所有动爻均无六合 / 相冲 / 生克关系';
    } else {
      if (worldLine) {
        forWorld = pickRelationFocus(active, worldLine, '世爻');
        if (!forWorld) worldEmpty = '世爻 与所有动爻均无六合 / 相冲 / 生克关系';
      }
      if (yongShen) {
        forYong = pickRelationFocus(active, yongShen, '用神');
        if (!forYong) yongEmpty = '用神 与所有动爻均无六合 / 相冲 / 生克关系';
      }
    }

    const parts: string[] = [];
    if (isYongChiShi) {
      if (forWorld) parts.push(relationDescPart('世爻/用神', forWorld));
      else if (worldEmpty) parts.push(worldEmpty);
    } else {
      if (forYong) parts.push(relationDescPart('用神', forYong));
      else if (yongEmpty) parts.push(yongEmpty);
      if (forWorld) parts.push(relationDescPart('世爻', forWorld));
      else if (worldEmpty) parts.push(worldEmpty);
    }
    const description = parts.length
      ? `由于不存在三合局和动动相生，${parts.join('；')}。`
      : '由于不存在三合局和动动相生，但所有动爻与世爻、用神均无明显关系。';

    return {
      mode,
      reason: 'relation',
      description,
      relationFocus: {
        forWorld: forWorld ?? undefined,
        forYong: forYong ?? undefined,
        isYongChiShi,
        worldEmpty,
        yongEmpty,
      },
    };
  }

  // 4c) 平均原则 fallback
  return {
    mode,
    reason: 'separate',
    description: '由于有多个动爻（含暗动），且不存在三合局和动动相生，因此对每个生克的动爻分别分析。',
    separatePositions: active.map(y => y.position),
  };
}
