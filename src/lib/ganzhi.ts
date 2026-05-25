import { HEAVENLY_STEMS, EARTHLY_BRANCHES, BRANCH_INDEX } from '../data/constants';
import type { EarthlyBranch, HeavenlyStem } from '../data/constants';
import type { GanZhi } from '../types';
import { getLunarYear, findGoverningJie } from './solarTerms';

// 甲子年：1984年是甲子年（公历年立春后）

// 年干支：以"立春"为界
// 立春前归上一个农历年；1984 = 甲子年（基准）
export function getYearGanzhi(date: Date): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const lunarYear = getLunarYear(date);
  const diff = lunarYear - 1984;
  const stemIdx = ((diff % 10) + 10) % 10;
  const branchIdx = ((diff % 12) + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
  };
}

// 月干支：以"节"为界
// 立春→寅、惊蛰→卯、清明→辰、立夏→巳、芒种→午、小暑→未、
// 立秋→申、白露→酉、寒露→戌、立冬→亥、大雪→子、小寒→丑
export function getMonthGanzhi(date: Date): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const { monthBranchIdx } = findGoverningJie(date);
  const branch = EARTHLY_BRANCHES[monthBranchIdx];

  // 月干：根据"农历年"年干推算（五虎遁年起月法）
  // 甲己年 - 寅月起丙寅; 乙庚年 - 寅月起戊寅; 丙辛年 - 寅月起庚寅;
  // 丁壬年 - 寅月起壬寅; 戊癸年 - 寅月起甲寅
  const lunarYear = getLunarYear(date);
  const yearStemIdx = (((lunarYear - 1984) % 10) + 10) % 10;
  const monthStemBase: Record<number, number> = {
    0: 2, // 甲年 -> 丙(2)
    1: 4, // 乙年 -> 戊(4)
    2: 6, // 丙年 -> 庚(6)
    3: 8, // 丁年 -> 壬(8)
    4: 0, // 戊年 -> 甲(0)
    5: 2, // 己年 -> 丙(2)
    6: 4, // 庚年 -> 戊(4)
    7: 6, // 辛年 -> 庚(6)
    8: 8, // 壬年 -> 壬(8)
    9: 0, // 癸年 -> 甲(0)
  };
  const baseMonthStem = monthStemBase[yearStemIdx] ?? 0;
  // 寅月是农历年首月（branchIdx=2），其后每月月干+1
  const monthOffset = (monthBranchIdx - 2 + 12) % 12;
  const stemIdx = (baseMonthStem + monthOffset) % 10;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch,
  };
}

// 日干支：儒略日 + 六十甲子偏移（已校准：2000-01-01=戊午，2024-01-01=甲子，2026-05-23=丁酉）
function julianDayNumber(year: number, month: number, day: number): number {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
}

const DAY_JD_OFFSET = 50;

export function getDayGanzhi(date: Date): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const idx = ((Math.floor(julianDayNumber(year, month, day) + DAY_JD_OFFSET) % 60) + 60) % 60;
  return {
    stem: HEAVENLY_STEMS[idx % 10],
    branch: EARTHLY_BRANCHES[idx % 12],
  };
}

// 时干支：根据日干和时辰
// 时支：子时=23:00-1:00, 丑时=1:00-3:00...（子时跨日，23点以后算当日子时）
export function getHourBranch(hour: number): EarthlyBranch {
  // 子时：23-1, 丑时：1-3, 寅时：3-5...
  const idx = Math.floor(((hour + 1) % 24) / 2);
  return EARTHLY_BRANCHES[idx];
}

export function getHourGanzhi(
  dayStemIdx: number,
  hour: number
): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const branch = getHourBranch(hour);
  const branchIdx = BRANCH_INDEX[branch];
  // 五鼠遁日起时法：甲己日->子时甲子
  // 甲己日基准：甲(0), 乙庚日基准：丙(2), 丙辛日基准：戊(4), 丁壬日基准：庚(6), 戊癸日基准：壬(8)
  const hourStemBase: Record<number, number> = {
    0: 0, 5: 0, // 甲己->甲(0)
    1: 2, 6: 2, // 乙庚->丙(2)
    2: 4, 7: 4, // 丙辛->戊(4)
    3: 6, 8: 6, // 丁壬->庚(6)
    4: 8, 9: 8, // 戊癸->壬(8)
  };
  const baseStem = hourStemBase[dayStemIdx] ?? 0;
  const stemIdx = (baseStem + branchIdx) % 10;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch,
  };
}

// 计算旬空
// 旬空：天干10个，地支12个，每旬从甲子开始，走完10天后有2个地支没有配到
export function calcXunKong(stem: HeavenlyStem, branch: EarthlyBranch): [EarthlyBranch, EarthlyBranch] {
  const stemIdx = HEAVENLY_STEMS.indexOf(stem);
  const branchIdx = EARTHLY_BRANCHES.indexOf(branch);
  // 旬首：将日干支退到该旬的甲日
  // 旬首地支 = branchIdx - stemIdx（mod 12）
  const xunShouBranchIdx = ((branchIdx - stemIdx) % 12 + 12) % 12;
  // 旬空 = 旬首地支 + 10, + 11
  const kong1 = EARTHLY_BRANCHES[(xunShouBranchIdx + 10) % 12];
  const kong2 = EARTHLY_BRANCHES[(xunShouBranchIdx + 11) % 12];
  return [kong1, kong2];
}

// 主函数：给定 Date，返回完整干支信息
export function dateToGanzhi(date: Date): GanZhi {
  const hour = date.getHours();

  const yearGz = getYearGanzhi(date);
  const monthGz = getMonthGanzhi(date);
  const dayGz = getDayGanzhi(date);
  const dayGzStemIdx = HEAVENLY_STEMS.indexOf(dayGz.stem);
  const hourGz = getHourGanzhi(dayGzStemIdx, hour);

  // 月建旬空（根据月柱干支）
  const monthXunKong = calcXunKong(monthGz.stem, monthGz.branch);
  // 日辰旬空（根据日柱干支）
  const dayXunKong = calcXunKong(dayGz.stem, dayGz.branch);

  return {
    yearStem: yearGz.stem,
    yearBranch: yearGz.branch,
    monthStem: monthGz.stem,
    monthBranch: monthGz.branch,
    dayStem: dayGz.stem,
    dayBranch: dayGz.branch,
    hourStem: hourGz.stem,
    hourBranch: hourGz.branch,
    monthXunKong,
    dayXunKong,
  };
}

export function formatGanzhi(gz: GanZhi): string {
  return `${gz.yearStem}${gz.yearBranch}年 ${gz.monthStem}${gz.monthBranch}月 ${gz.dayStem}${gz.dayBranch}日 ${gz.hourStem}${gz.hourBranch}时`;
}
