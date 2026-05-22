import type { EarthlyBranch, HeavenlyStem, SixRelative } from '../data/constants';

export type { EarthlyBranch, HeavenlyStem, SixRelative };

export type Category = '妻财' | '官鬼' | '父母' | '子孙' | '兄弟';
export type DivinationMethod = 'modern' | 'ancient' | 'manual';

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
  isWorldLine: boolean;               // 世爻
  isResponseLine: boolean;            // 应爻
  // 计分
  monthScore: number;
  dayScore: number;
  energyScore: number;               // 先天能量 = monthScore + dayScore
  // 特殊状态
  isMonthXunKong: boolean;
  isDayXunKong: boolean;
  isMonthPo: boolean;
  isDayPo: boolean;
  isMonthHe: boolean;
  isDayHe: boolean;
  // 变爻特殊（只有 isMoving=true 时有意义）
  changedFlags?: ChangedYaoFlags;
  finalState?: YaoFinalState;        // 动爻最终状态
  // 入墓
  tombType: TombType;
  // 伏神信息（可选）
  fuShenBranch?: EarthlyBranch;
  fuShenElement?: string;
  fuShenRelative?: SixRelative;
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
}

// 吉凶判断文字
export interface JudgmentText {
  preTianStatus: string;      // 先天状态段落
  dongYaoRelation: string;    // 动爻/暗动关系段落
  worldYongRelation: string;  // 世用关系
  verdict: '吉' | '凶' | '不吉';
  verdictReason: string;      // 结论理由
}

// 用户输入
export interface HexagramInput {
  matter: string;
  category: Category;
  time: Date;
  method: DivinationMethod;
  coinsInput?: string;        // 现代/古代硬币 6位数字字符串
  manualLines?: YaoType[];    // 手动输入
}
