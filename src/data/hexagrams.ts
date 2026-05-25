import type { EarthlyBranch } from './constants';
import type { HexagramInfo } from '../types';
import { BRANCH_ELEMENT, SHENG_MAP, KE_MAP } from './constants';
import type { SixRelative } from './constants';
import { HEXAGRAM_DETAILS } from './hexagramDetails';

// 八卦三爻（从一爻到三爻，0=阴，1=阳）
const TRIGRAM_LINES: Record<string, [0|1, 0|1, 0|1]> = {
  '乾': [1,1,1], '坤': [0,0,0], '震': [1,0,0], '巽': [0,1,1],
  '坎': [0,1,0], '离': [1,0,1], '艮': [0,0,1], '兑': [1,1,0],
};

// 正确的 NAJIA 纳甲地支模板（来源：京房易传，验证于 bopo/najia 等主流开源项目）
// inner = 内卦（一二三爻），outer = 外卦（四五六爻）
export const PALACE_BRANCHES: Record<string, { inner: EarthlyBranch[]; outer: EarthlyBranch[] }> = {
  '乾': { inner: ['子','寅','辰'], outer: ['午','申','戌'] }, // 甲/壬
  '坤': { inner: ['未','巳','卯'], outer: ['丑','亥','酉'] }, // 乙/癸
  '震': { inner: ['子','寅','辰'], outer: ['午','申','戌'] }, // 庚
  '巽': { inner: ['丑','亥','酉'], outer: ['未','巳','卯'] }, // 辛
  '坎': { inner: ['寅','辰','午'], outer: ['申','戌','子'] }, // 戊（注：非寅子戌）
  '离': { inner: ['卯','丑','亥'], outer: ['酉','未','巳'] }, // 己（注：非巳未酉）
  '艮': { inner: ['辰','午','申'], outer: ['戌','子','寅'] }, // 丙（注：非辰寅子）
  '兑': { inner: ['巳','卯','丑'], outer: ['亥','酉','未'] }, // 丁（注：非巳未酉）
};

// 每个卦的所属宫（用于伏神计算）
const HEXAGRAM_PALACE: Record<string, string> = {
  // 乾宫
  '乾为天':'乾','天风姤':'乾','天山遁':'乾','天地否':'乾',
  '风地观':'乾','山地剥':'乾','火地晋':'乾','火天大有':'乾',
  // 坤宫
  '坤为地':'坤','地雷复':'坤','地泽临':'坤','地天泰':'坤',
  '雷天大壮':'坤','泽天夬':'坤','水天需':'坤','水地比':'坤',
  // 震宫
  '震为雷':'震','雷地豫':'震','雷水解':'震','雷风恒':'震',
  '地风升':'震','水风井':'震','泽风大过':'震','泽雷随':'震',
  // 巽宫
  '巽为风':'巽','风天小畜':'巽','风火家人':'巽','风雷益':'巽',
  '天雷无妄':'巽','火雷噬嗑':'巽','山雷颐':'巽','山风蛊':'巽',
  // 坎宫
  '坎为水':'坎','水泽节':'坎','水雷屯':'坎','水火既济':'坎',
  '泽火革':'坎','雷火丰':'坎','地火明夷':'坎','地水师':'坎',
  // 离宫
  '离为火':'离','火山旅':'离','火风鼎':'离','火水未济':'离',
  '山水蒙':'离','风水涣':'离','天水讼':'离','天火同人':'离',
  // 艮宫
  '艮为山':'艮','山火贲':'艮','山天大畜':'艮','山泽损':'艮',
  '火泽睽':'艮','天泽履':'艮','风泽中孚':'艮','风山渐':'艮',
  // 兑宫
  '兑为泽':'兑','泽水困':'兑','泽地萃':'兑','泽山咸':'兑',
  '水山蹇':'兑','地山谦':'兑','雷山小过':'兑','雷泽归妹':'兑',
};

// 自动从下卦/上卦的宫位计算六爻地支
function autoBranches(lower: string, upper: string): EarthlyBranch[] {
  return [
    ...PALACE_BRANCHES[lower].inner,
    ...PALACE_BRANCHES[upper].outer,
  ];
}

function makeLines(lower: string, upper: string): [0|1,0|1,0|1,0|1,0|1,0|1] {
  return [...TRIGRAM_LINES[lower], ...TRIGRAM_LINES[upper]] as [0|1,0|1,0|1,0|1,0|1,0|1];
}

function getResponseLine(world: number): number {
  return world <= 3 ? world + 3 : world - 3;
}

// [卦名, 下卦, 上卦, 世爻(1-6), 简义]
type RawHex = [string, string, string, number, string];

const RAW_HEXAGRAMS: RawHex[] = [
  // ===乾宫===
  ['乾为天',   '乾','乾', 6, '元亨利贞，刚健纯粹，自强不息'],
  ['天风姤',   '巽','乾', 1, '遇合相逢，阴气初生，防小人觊觎'],
  ['天山遁',   '艮','乾', 2, '退避隐遁，暂避锋芒，待时而动'],
  ['天地否',   '坤','乾', 3, '阴阳不交，天地不通，闭塞不顺'],
  ['风地观',   '坤','巽', 4, '观察审视，以德教化，宜静待变'],
  ['山地剥',   '坤','艮', 5, '剥落消蚀，局势不利，宜守不宜进'],
  ['火地晋',   '坤','离', 4, '晋升进取，光明上升，前途光明（游魂）'],
  ['火天大有', '乾','离', 3, '大有所获，盛大丰收，光明富足（归魂）'],
  // ===坤宫===
  ['坤为地',   '坤','坤', 6, '厚德载物，柔顺承天，包容宽厚'],
  ['地雷复',   '震','坤', 1, '阳气回复，冬去春来，否极泰来'],
  ['地泽临',   '兑','坤', 2, '居高临下，亲临督导，亨通有利'],
  ['地天泰',   '乾','坤', 3, '天地交泰，阴阳和谐，万事亨通'],
  ['雷天大壮', '乾','震', 4, '阳气壮盛，威猛进取，但需守正'],
  ['泽天夬',   '乾','兑', 5, '果断决绝，扬善除恶，刚毅果断'],
  ['水天需',   '乾','坎', 4, '等待时机，以诚待人，守正待时（游魂）'],
  ['水地比',   '坤','坎', 3, '亲比相辅，团结协力，亲密无间（归魂）'],
  // ===震宫===
  ['震为雷',   '震','震', 6, '雷震大动，威势惊人，奋发有为'],
  ['雷地豫',   '坤','震', 1, '喜悦欢乐，先豫后劳，切莫懈怠'],
  ['雷水解',   '坎','震', 2, '解除困难，危机化解，宜速行动'],
  ['雷风恒',   '巽','震', 3, '恒久坚持，持之以恒，守正不移'],
  ['地风升',   '巽','坤', 4, '向上升进，积小成大，步步高升'],
  ['水风井',   '巽','坎', 5, '井养不穷，修德养民，施惠无私'],
  ['泽风大过', '巽','兑', 4, '大有过失，栋梁弯折，独立不惧（游魂）'],
  ['泽雷随',   '震','兑', 3, '随时顺势，随机应变，顺应时机（归魂）'],
  // ===巽宫===
  ['巽为风',   '巽','巽', 6, '谦逊随顺，入微渗透，柔顺申命'],
  ['风天小畜', '乾','巽', 1, '小有积蓄，力量有限，宜积小成大'],
  ['风火家人', '离','巽', 2, '家庭和睦，各司其职，内外有别'],
  ['风雷益',   '震','巽', 3, '增益受益，损上益下，利于前进'],
  ['天雷无妄', '震','乾', 4, '无妄之灾，不违天理，顺应自然'],
  ['火雷噬嗑', '震','离', 5, '噬嗑克难，执法严明，刚柔相济'],
  ['山雷颐',   '震','艮', 4, '颐养正道，慎言节食，自我修养（游魂）'],
  ['山风蛊',   '巽','艮', 3, '蛊惑拨乱，振弊起衰，拨乱反正（归魂）'],
  // ===坎宫===
  ['坎为水',   '坎','坎', 6, '险难重重，以诚克难，刚中有孚'],
  ['水泽节',   '兑','坎', 1, '节制有度，守正持中，适可而止'],
  ['水雷屯',   '震','坎', 2, '艰难初创，万事开头难，坚持必成'],
  ['水火既济', '离','坎', 3, '功成圆满，既济之后需防未济'],
  ['泽火革',   '离','兑', 4, '变革革新，革故鼎新，顺天应人'],
  ['雷火丰',   '离','震', 5, '丰盛鼎盛，光明壮大，宜防盛极'],
  ['地火明夷', '离','坤', 4, '明入地中，才德受损，韬光养晦（游魂）'],
  ['地水师',   '坎','坤', 3, '统兵用师，以正克敌，纪律严明（归魂）'],
  // ===离宫===
  ['离为火',   '离','离', 6, '光明磊落，附丽正道，文明昌盛'],
  ['火山旅',   '艮','离', 1, '旅行在外，谨慎小心，知足守正'],
  ['火风鼎',   '巽','离', 2, '鼎烹新政，革故鼎新，稳重施政'],
  ['火水未济', '坎','离', 3, '未成既济，事未成功，需继续努力'],
  ['山水蒙',   '坎','艮', 4, '蒙昧初启，启蒙教育，以正养蒙'],
  ['风水涣',   '坎','巽', 5, '涣散离析，拯救涣散，重聚人心'],
  ['天水讼',   '坎','乾', 4, '争讼不断，慎防争讼，宜和不宜争（游魂）'],
  ['天火同人', '离','乾', 3, '与人同心，团结一致，共同事业（归魂）'],
  // ===艮宫===
  ['艮为山',   '艮','艮', 6, '止而不进，适时而止，知止为德'],
  ['山火贲',   '离','艮', 1, '文饰华美，外表光华，内涵方正'],
  ['山天大畜', '乾','艮', 2, '大有蓄积，博学深积，待时而用'],
  ['山泽损',   '兑','艮', 3, '损下益上，减损私欲，积德累行'],
  ['火泽睽',   '兑','离', 4, '乖戾相违，同中有异，小事可为'],
  ['天泽履',   '兑','乾', 5, '礼行正道，谨慎行事，礼义规矩'],
  ['风泽中孚', '兑','巽', 4, '诚信孚众，内外诚信，感化万物（游魂）'],
  ['风山渐',   '艮','巽', 3, '循序渐进，按部就班，终达彼岸（归魂）'],
  // ===兑宫===
  ['兑为泽',   '兑','兑', 6, '喜悦愉快，柔外刚内，和顺悦人'],
  ['泽水困',   '坎','兑', 1, '穷困受困，君子固穷，处困守节'],
  ['泽地萃',   '坤','兑', 2, '荟萃聚集，聚合众力，防止乖离'],
  ['泽山咸',   '艮','兑', 3, '感应相通，男女相感，虚心感物'],
  ['水山蹇',   '艮','坎', 4, '艰难险阻，知难守正，等待时机'],
  ['地山谦',   '艮','坤', 5, '谦逊谦卑，谦谦君子，终有所成'],
  ['雷山小过', '艮','震', 4, '小有过失，飞鸟遗音，宜小不宜大（游魂）'],
  ['雷泽归妹', '兑','震', 3, '归妹嫁人，无正有凶，慎重而行（归魂）'],
];

export const HEXAGRAMS_MAP = new Map<string, HexagramInfo>();
export const HEXAGRAMS_LIST: HexagramInfo[] = [];

function linesKey(lines: [0|1,0|1,0|1,0|1,0|1,0|1]): string {
  return lines.join('');
}

RAW_HEXAGRAMS.forEach(([name, lower, upper, world, desc], i) => {
  const lines = makeLines(lower, upper);
  const branches = autoBranches(lower, upper);
  // 详细卦义优先；缺失时回落到简义
  const description = HEXAGRAM_DETAILS[name] ?? desc;
  const info: HexagramInfo = {
    index: i + 1,
    name,
    upperTrigram: upper,
    lowerTrigram: lower,
    description,
    lines,
    worldLine: world,
    responseLine: getResponseLine(world),
    branches,
  };
  HEXAGRAMS_MAP.set(linesKey(lines), info);
  HEXAGRAMS_LIST.push(info);
});

export function findHexagram(lines: [0|1,0|1,0|1,0|1,0|1,0|1]): HexagramInfo | undefined {
  return HEXAGRAMS_MAP.get(linesKey(lines));
}

// ── 特殊卦属性 ───────────────────────────────────────────────
// 六冲卦：八纯卦 + 天雷无妄 + 雷天大壮（共10卦）
const LIU_CHONG_NAMES = new Set<string>([
  '乾为天', '坤为地', '震为雷', '巽为风',
  '坎为水', '离为火', '艮为山', '兑为泽',
  '天雷无妄', '雷天大壮',
]);
// 六合卦：一爻/四爻、二爻/五爻、三爻/六爻地支两两相合（共8卦）
const LIU_HE_NAMES = new Set<string>([
  '地天泰', '天地否',
  '雷地豫', '地雷复',
  '泽水困', '水泽节',
  '火山旅', '山火贲',
]);
// 八纯卦：八宫之首，上下卦同名（共8卦）
const BA_CHUN_NAMES = new Set<string>([
  '乾为天', '坤为地', '震为雷', '巽为风',
  '坎为水', '离为火', '艮为山', '兑为泽',
]);
// 游魂卦：八宫第七卦（共8卦）
const YOU_HUN_NAMES = new Set<string>([
  '火地晋', '水天需', '泽风大过', '山雷颐',
  '地火明夷', '天水讼', '风泽中孚', '雷山小过',
]);
// 归魂卦：八宫第八卦（共8卦）
const GUI_HUN_NAMES = new Set<string>([
  '火天大有', '水地比', '泽雷随', '山风蛊',
  '地水师', '天火同人', '风山渐', '雷泽归妹',
]);

// 单卦标签集合（用于卦名后缀展示）
export function getHexagramAttributes(name: string): string[] {
  const labels: string[] = [];
  if (LIU_CHONG_NAMES.has(name)) labels.push('六冲卦');
  if (LIU_HE_NAMES.has(name))    labels.push('六合卦');
  if (BA_CHUN_NAMES.has(name))   labels.push('八纯卦');
  if (GUI_HUN_NAMES.has(name))   labels.push('归魂卦');
  if (YOU_HUN_NAMES.has(name))   labels.push('游魂卦');
  return labels;
}

// 兼容旧 API
export type HexagramRelation = '六合' | '六冲' | null;
export function getHexagramRelation(name: string): HexagramRelation {
  if (LIU_CHONG_NAMES.has(name)) return '六冲';
  if (LIU_HE_NAMES.has(name))    return '六合';
  return null;
}

// ── 本卦 ↔ 变卦 关系：错 / 综 / 互 ───────────────────────────
type Hex6 = readonly [0|1,0|1,0|1,0|1,0|1,0|1];

// 错卦（旁通卦）：每爻取反
function isCuoOf(ben: Hex6, target: Hex6): boolean {
  return ben.every((v, i) => target[i] === (v === 0 ? 1 : 0));
}
// 综卦（反对卦）：六爻倒序
function isZongOf(ben: Hex6, target: Hex6): boolean {
  return ben.every((v, i) => target[5 - i] === v);
}
// 互卦：取本卦的 2,3,4 爻为新下卦，3,4,5 爻为新上卦
function isHuOf(ben: Hex6, target: Hex6): boolean {
  const hu: [0|1,0|1,0|1,0|1,0|1,0|1] = [ben[1], ben[2], ben[3], ben[2], ben[3], ben[4]];
  return hu.every((v, i) => target[i] === v);
}

// 给本卦/变卦的爻线，返回它们之间的特殊关系（可能多个）
export function getBenBianRelations(benLines: Hex6, bianLines: Hex6): string[] {
  const labels: string[] = [];
  if (isCuoOf(benLines, bianLines))  labels.push('错卦');
  if (isZongOf(benLines, bianLines)) labels.push('综卦');
  if (isHuOf(benLines, bianLines))   labels.push('互卦');
  return labels;
}

export function calcChangedLines(
  originalLines: [0|1,0|1,0|1,0|1,0|1,0|1],
  movingPositions: number[]
): [0|1,0|1,0|1,0|1,0|1,0|1] {
  const changed = [...originalLines] as [0|1,0|1,0|1,0|1,0|1,0|1];
  for (const pos of movingPositions) {
    const idx = pos - 1;
    changed[idx] = changed[idx] === 0 ? 1 : 0;
  }
  return changed;
}

// 八卦五行（用于六爻六亲判定：以本宫五行为"我"）
export const TRIGRAM_ELEMENT: Record<string, string> = {
  '乾': '金', '兑': '金',
  '离': '火',
  '震': '木', '巽': '木',
  '坎': '水',
  '艮': '土', '坤': '土',
};

// 六亲计算（六爻法：以"卦宫五行"为我，与日干无关）
//   我 = palaceElement
//   同类      → 兄弟
//   我生(被我生) → 子孙
//   生我      → 父母
//   我克      → 妻财
//   克我      → 官鬼
export function calcRelative(palaceElement: string, yaoBranch: string): SixRelative {
  const yaoElement = BRANCH_ELEMENT[yaoBranch as EarthlyBranch] || '土';
  if (palaceElement === yaoElement) return '兄弟';
  if (SHENG_MAP[palaceElement] === yaoElement) return '子孙';
  if (SHENG_MAP[yaoElement] === palaceElement) return '父母';
  if (KE_MAP[palaceElement] === yaoElement) return '妻财';
  if (KE_MAP[yaoElement] === palaceElement) return '官鬼';
  return '兄弟';
}

// 卦名 → 宫五行
export function getPalaceElement(hexagramName: string): string {
  const palace = HEXAGRAM_PALACE[hexagramName] ?? '乾';
  return TRIGRAM_ELEMENT[palace] ?? '金';
}

// 获取某卦的宫主卦全部地支（用于伏神计算）
export function getPalacePureBranches(hexagramName: string): EarthlyBranch[] {
  const palace = HEXAGRAM_PALACE[hexagramName] ?? '乾';
  return [...PALACE_BRANCHES[palace].inner, ...PALACE_BRANCHES[palace].outer];
}

export { HEXAGRAM_PALACE };
