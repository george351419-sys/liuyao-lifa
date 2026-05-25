import type { YaoType } from '../types';

// 现代硬币摇卦：
// 以币面数字为阳，国徽为阴
// 输入6位数字，每位0-3，表示3枚硬币中数字（阳）朝上的个数
// 0=老阴, 1=少阳, 2=少阴, 3=老阳
export function modernCoin(input: string): YaoType[] {
  const result: YaoType[] = [];
  for (let i = 0; i < 6; i++) {
    const n = parseInt(input[i] ?? '1', 10);
    result.push(clampYaoType(n));
  }
  return result;
}

// 古代钱币摇卦：
// 以背面（简单面）为阳，字面（复杂面）为阴
// 输入6位数字，每位0-3，表示3枚铜钱中字面朝上的个数（即阴的个数）
// 阴的个数 n → 阳的个数 = 3 - n
// 0阴=3阳=老阳=3, 1阴=2阳=少阴=2, 2阴=1阳=少阳=1, 3阴=0阳=老阴=0
export function ancientCoin(input: string): YaoType[] {
  const result: YaoType[] = [];
  for (let i = 0; i < 6; i++) {
    const n = parseInt(input[i] ?? '1', 10);
    const yangCount = 3 - Math.min(3, Math.max(0, n));
    result.push(clampYaoType(yangCount));
  }
  return result;
}

function clampYaoType(n: number): YaoType {
  const c = Math.min(3, Math.max(0, Math.round(n)));
  return c as YaoType;
}

// 起数法：输入字符串格式 "a b"，两个整数
// a % 8 → 下卦序号（0-7），b % 6 → 上卦序号（0-5），当前分钟 % 6 + 1 → 动爻位置
// 生成六爻：下卦三爻 + 上卦三爻，动爻位置设为老阳(3)，其余按序号奇偶确定阴阳
const TRIGRAM_LINES: [0|1, 0|1, 0|1][] = [
  [1, 1, 1], // 0: 乾
  [1, 0, 0], // 1: 震
  [0, 1, 0], // 2: 坎
  [1, 0, 1], // 3: 艮  (实际纳甲顺序按文王八卦：乾兑离震巽坎艮坤)
  [0, 0, 0], // 4: 坤
  [0, 1, 1], // 5: 巽
  [1, 0, 1], // 6: 坎(重)
  [0, 0, 1], // 7: 艮
];

export function numberMethod(input: string, time: Date): YaoType[] {
  const parts = input.trim().split(/\s+/);
  const a = parseInt(parts[0] ?? '0', 10) || 0;
  const b = parseInt(parts[1] ?? '0', 10) || 0;
  const lowerIdx = ((a % 8) + 8) % 8;
  const upperIdx = ((b % 6) + 6) % 6; // use mod 6 for upper
  const dongYao = (time.getMinutes() % 6) + 1; // 1-6

  const lowerLines = TRIGRAM_LINES[lowerIdx];
  const upperLines = TRIGRAM_LINES[upperIdx];
  const allLines: (0|1)[] = [...lowerLines, ...upperLines];

  const result: YaoType[] = allLines.map((line, i) => {
    const pos = i + 1; // 1-6
    if (pos === dongYao) return 3; // 老阳（动爻）
    return line === 1 ? 1 : 2; // 少阳 or 少阴
  });
  return result;
}

// 从 YaoType 判断是否为阳爻（用于构建本卦线条）
// 少阳(1)=阳, 老阳(3)=阳, 少阴(2)=阴, 老阴(0)=阴
export function isYang(yaoType: YaoType): 0 | 1 {
  return (yaoType === 1 || yaoType === 3) ? 1 : 0;
}

// 是否为动爻
export function isMovingYao(yaoType: YaoType): boolean {
  return yaoType === 0 || yaoType === 3; // 老阴或老阳
}
