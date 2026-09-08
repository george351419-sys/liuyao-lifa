import type { EarthlyBranch, HeavenlyStem, SixRelative } from '../data/constants';

export type { EarthlyBranch, HeavenlyStem, SixRelative };

export type Category = '妻财' | '官鬼' | '父母' | '子孙' | '兄弟';
export type DivinationMethod = 'modern' | 'ancient' | 'manual' | 'number';

// 爻的原始类型：0=老阴, 1=少阳, 2=少阴, 3=老阳
export type YaoType = 0 | 1 | 2 | 3;

// 干支
export interface GanZhi {
  yearStem: HeavenlyStem;
  yearBranch: EarthlyBranch;
  monthStem: HeavenlyStem;
  monthBranch: EarthlyBranch;
  dayStem: HeavenlyStem;
  dayBranch: EarthlyBranch;
  hourStem: HeavenlyStem;
  hourBranch: EarthlyBranch;
  // 旬空（月建旬空和日辰旬空各两个地支）
  monthXunKong: [EarthlyBranch, EarthlyBranch];
  dayXunKong: [EarthlyBranch, EarthlyBranch];
}

// 变爻特殊状态
export interface ChangedYaoFlags {
  isFanYin: boolean;      // 反吟
  isFuYin: boolean;       // 伏吟
  isHuiTouSheng: boolean; // 回头生
  isHuiTouKe: boolean;    // 回头克
  isHuaJin: boolean;      // 化进
  isHuaTui: boolean;      // 化退
  isHuaJue: boolean;      // 化绝
  isHuaPo: boolean;       // 化破
  isHuaLinMonth: boolean; // 化临月建
  isHuaLinDay: boolean;   // 化临日辰
  isHuaMonthXunKong: boolean; // 变爻月建旬空
  isHuaDayXunKong: boolean;   // 变爻日辰旬空
}

// 入墓类型
export type TombType = 'month' | 'day' | 'dong' | 'hua' | 'fei' | null;

// 动爻最终状态
export type YaoFinalState = '化废' | '化旺' | '化旺也化废' | '平动' | null;

// 单爻完整状态
export interface YaoState {
  position: 1 | 2 | 3 | 4 | 5 | 6; // 1=初爻，6=上爻
  yaoBranch: EarthlyBranch;          // 本卦爻地支
  yaoElement: string;                 // 本卦爻五行
  isYangYao: boolean;                 // 是否阳爻（本卦爻线，决定实线/断线）
  relative: SixRelative;             // 六亲
  liuShen: string;                    // 六神
  isMoving: boolean;                  // 是否动爻
  isHidden: boolean;                  // 是否暗动
  changedBranch?: EarthlyBranch;     // 变爻地支（动爻才有）
  changedElement?: string;            // 变爻五行
  changedRelative?: SixRelative;     // 变爻六亲（动爻才有）
  changedIsYang?: boolean;           // 变爻阴阳（动爻才有）
  isWorldLine: boolean;               // 世爻
  isResponseLine: boolean;            // 应爻
  // 本卦计分
  monthScore: number;
  dayScore: number;
  energyScore: number;
  // 变爻计分（动爻才有）
  changedEnergyScore?: number;
  // 特殊状态
  isMonthXunKong: boolean;
  isDayXunKong: boolean;
  isMonthPo: boolean;
  isDayPo: boolean;
  isMonthHe: boolean;
  isDayHe: boolean;
  // 变爻特殊
  changedFlags?: ChangedYaoFlags;
  finalState?: YaoFinalState;
  // 入墓
  tombType: TombType;
  // 该爻自身充当"墓库容器"标记（用于地支字底色填充）
  yaoBranchTombFill?: 'dong' | null;       // 本卦地支作为动入墓的容器（黄）
  changedBranchTombFill?: 'hua' | null;    // 变卦地支作为化入墓的容器（紫）
  // 该 YaoState 实例是否为"伏神视图"——用神是伏神时用此标记
  isFuShenView?: boolean;
  // 伏神（含完整标记）
  fuShenBranch?: EarthlyBranch;
  fuShenElement?: string;
  fuShenRelative?: SixRelative;
  fuShenEnergyScore?: number;
  fuShenIsMonthXK?: boolean;
  fuShenIsDayXK?: boolean;
  fuShenIsMonthPo?: boolean;
  fuShenIsDayPo?: boolean;
  fuShenIsMonthHe?: boolean;
  fuShenIsDayHe?: boolean;
}

// 卦数据
export interface HexagramInfo {
  index: number;          // 1-64
  name: string;           // 卦名
  upperTrigram: string;   // 上卦名
  lowerTrigram: string;   // 下卦名
  description: string;    // 简要卦义
  lines: [0|1, 0|1, 0|1, 0|1, 0|1, 0|1]; // 六爻阴阳（0=阴, 1=阳），index 0=一爻
  worldLine: number;      // 世爻位置（1-6）
  responseLine: number;   // 应爻位置（1-6）
  // 六亲分配（和日主五行有关，此处存各纳甲地支）
  branches: EarthlyBranch[]; // index 0=一爻
}

// 三合局结果
export interface SanHeResult {
  element: string;   // 合成五行
  zhongShen: EarthlyBranch; // 中神
  yaos: number[];    // 参与的爻位（1-6）
  isComplete: boolean;
}

// 多动爻选取模式
export type DongYaoSelectionMode = 'average' | 'relation' | 'energy';

// 重点动爻的选取依据
export type DongYaoFocusReason =
  | 'none-active'    // 没有动爻或暗动
  | 'single'         // 只有一个动爻（或暗动）
  | 'sanhe'          // 多动爻 + 三合局 → 以中神为重点
  | 'shengChain'     // 多动爻 + 动动相生 → 以最终被生爻为重点
  | 'shengCycle'     // 多动爻 + 相生闭环（五行齐全） → 长度一致，分别分析
  | 'separate'       // 平均原则 fallback：每个分别分析
  | 'energy'         // 能量优先：按动爻能量级别选取
  | 'relation';      // 关系优先：按动爻与世/用神关系级别选取

// 能量优先：动爻能量级别
export type DongYaoEnergyLevel = '化旺' | '平动' | '化废';

// 能量优先所选取的爻
export interface EnergyFocusYao {
  position: number;
  branch: EarthlyBranch;
  level: DongYaoEnergyLevel;
  energyScore: number;       // 先天能量
  wangShuai: WangShuai;
  reason: string;
}

// 关系优先：动爻与目标（世/用神）的关系等级
export type DongYaoRelationKind = '六合' | '相冲' | '被生' | '被克' | '主生' | '主克';

// 关系优先：对单个目标（世爻 或 用神）所选取的重点动爻
export interface RelationFocusEntry {
  position: number;
  branch: EarthlyBranch;
  relation: DongYaoRelationKind;
  level: DongYaoEnergyLevel;
  energyScore: number;
  wangShuai: WangShuai;
  reason: string;
}

// 动动相生「按终点分组」
// 同一终点可能有多条独立的上行链（如 午→戌→申、午→辰→申 共享终点 申）
export interface ShengChain {
  terminalPosition: number;       // 终点爻位
  terminalBranch: EarthlyBranch; // 终点地支
  terminalWangShuai: WangShuai;
  terminalReason: string;         // 旺衰判定理由
  // 通到此终点的多条独立上行链；每条都以终点结尾
  chains: {
    positions: number[];           // 完整链爻位（含终点），按相生方向
    branches: EarthlyBranch[];     // 完整链地支（含终点），按相生方向
  }[];
}

// 动爻分析结果
export interface DongYaoAnalysis {
  mode: DongYaoSelectionMode;
  reason: DongYaoFocusReason;
  description: string;            // 给用户呈现的总说明（"由于...因此..."）
  // single 时：单动爻的爻位 + 旺衰
  singlePosition?: number;
  singleBranch?: EarthlyBranch;
  singleWangShuai?: WangShuai;
  singleReason?: string;
  // sanhe 时：中神信息（中神爻位若中神已发动则给出，否则只展示中神地支）
  sanHeZhongShenBranch?: EarthlyBranch;
  sanHeZhongShenPosition?: number;  // 若中神在卦上对应的爻位
  sanHeZhongShenWangShuai?: WangShuai;
  sanHeZhongShenReason?: string;
  sanHeElement?: string;
  // shengChain 时：可能多条独立的相生链，每条分别展示终点旺衰
  shengChains?: ShengChain[];
  // shengCycle 时：相生闭环（五行齐全），元素流转 + 参与的所有动爻
  shengCycle?: {
    elementChain: string[];                // 元素闭环，如 ['水','木','火','土','金','水']
    participants: {                         // 所有参与的动爻（按爻位升序）
      position: number;
      branch: EarthlyBranch;
      element: string;
    }[];
  };
  // separate 时：被分别分析的动爻/暗动爻位列表
  separatePositions?: number[];
  // energy 时：1 或 2 个能量优先选取的动爻
  energyFocus?: EnergyFocusYao[];
  // relation 时：对世爻、对用神各自的重点动爻（用神持世时合一）
  relationFocus?: {
    forWorld?: RelationFocusEntry;   // 对世爻的重点动爻
    forYong?: RelationFocusEntry;    // 对用神的重点动爻
    isYongChiShi: boolean;           // 用神持世时合并显示
    worldEmpty?: string;             // 世爻没找到任何关系动爻时的说明
    yongEmpty?: string;              // 用神没找到任何关系动爻时的说明
  };
}

// 排盘完整结果
export interface HexagramResult {
  ganzhi: GanZhi;
  originalHexagram: HexagramInfo;
  changedHexagram?: HexagramInfo;
  yaos: YaoState[];           // 六爻，index 0=一爻
  sanHe: SanHeResult | null;
  yongShen: YaoState | null;
  yongShenList: YaoState[];   // 同类十神的所有爻（取最高分者为主）
  judgment: JudgmentText;
  dongYaoAnalysis: DongYaoAnalysis;
  // 月支/日支是否作为墓库容器（影响 GanzhiBar 中地支字底色）
  tombFill: { month: boolean; day: boolean };
}

// 综合判断的吉凶定性等级（6 级）
export type ComprehensiveVerdict = '大吉' | '小吉' | '平吉' | '平凶' | '小凶' | '大凶' | '凶' | '平';
// 旺衰判定
export type WangShuai = '旺' | '衰' | '平';
// 世用关系六大类型
export type WorldYongRelationType =
  | '世爻生用神' | '世爻克用神'
  | '用神生世爻' | '用神克世爻'
  | '比和' | '用神持世';

// 吉凶判断文字
export interface JudgmentText {
  // 先天能量（用神 / 世爻 分两段；持世时只用 preTianWorld）
  preTianYong: string;
  preTianWorld: string;
  // 动爻 / 暗动影响（同上）
  dongYaoYong: string;
  dongYaoWorld: string;
  // 用神持世：true 时 yong 段不渲染，world 段标签为"世爻/用神"
  isYongChiShi: boolean;
  // 世用关系（分三段：类型 / 含义 / 吉凶本质）
  worldYongRelation: {
    type: WorldYongRelationType | null;
    meaning: string;
    essence: string;
  };
  // 综合判断（结合世/用神旺衰 × 关系类型得出 6 级吉凶）
  comprehensive: {
    worldWangShuai: WangShuai;
    yongWangShuai: WangShuai;
    statusLine: string;          // "本卦中，世爻旺相，用神旺相，世爻生用神"
    verdict: ComprehensiveVerdict;
    explanation: string;
  };
  // 顶部徽章用的简化结论（保持向后兼容）
  verdict: '吉' | '凶' | '不吉';
  verdictReason: string;
}

// 用户输入
export interface HexagramInput {
  matter: string;
  category: Category;
  time: Date;
  method: DivinationMethod;
  coinsInput?: string;        // 现代/古代硬币 6位数字字符串
  manualLines?: YaoType[];    // 手动输入
  dongYaoMode?: DongYaoSelectionMode;  // 多动爻选取模式（默认 'average' 平均原则）
}
