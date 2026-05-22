import { HEAVENLY_STEMS, EARTHLY_BRANCHES, BRANCH_INDEX } from '../data/constants';
import type { EarthlyBranch, HeavenlyStem } from '../data/constants';
import type { GanZhi } from '../types';

// 1900年1月31日 = 庚子年 庚子月 甲戌日（已知基准日）
// 甲子年：1984年是甲子年，1月1日是甲子年起点参考

// 年干支：以公历年为基准
// 1984 = 甲子年 (stem=0, branch=0)
export function getYearGanzhi(year: number): { stem: HeavenlyStem; branch: EarthlyBranch } {
  const baseYear = 1984; // 甲子年
  const diff = year - baseYear;
  const stemIdx = ((diff % 10) + 10) % 10;
  const branchIdx = ((diff % 12) + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
  };
}

// 月干支：以节气为界，简化版（按公历月份近似）
// 实际应按节气，但此处用农历月份近似（误差约3天内）
// 寅月=正月=2月（节气：立春前后），卯月=二月=3月...
// 月支：1月=丑月，2月=寅月...12月=丑月（以立春前后为界）
// 简化：以15号为节气分界点
export function getMonthGanzhi(
  year: number, month: number, _day: number
): { stem: HeavenlyStem; branch: EarthlyBranch } {
  // 月支（以节气简化，1月=丑, 2月=寅, ..., 12月=子）
  // 准确来说需要节气，这里用月份-1近似
  // 寅月 = 公历2月, 月支index=2(寅)
  // 标准：月建从寅开始，对应地支子(0)...
  // 月支索引: 1月=丑(1), 2月=寅(2), ..., 11月=子(0), 12月=丑(1)
  // 但要考虑节气：如果当天在节气前，则属于上个月干支
  // 简化处理：月份直接对应
  const monthBranchMap: Record<number, number> = {
    1: 1,  // 丑
    2: 2,  // 寅
    3: 3,  // 卯
    4: 4,  // 辰
    5: 5,  // 巳
    6: 6,  // 午
    7: 7,  // 未
    8: 8,  // 申
    9: 9,  // 酉
    10: 10, // 戌
    11: 11, // 亥
    12: 0,  // 子
  };
  const branchIdx = monthBranchMap[month] ?? 0;
  const branch = EARTHLY_BRANCHES[branchIdx];

  // 月干：根据年干推算（五虎遁年起月法）
  // 甲己年 - 寅月起丙寅; 乙庚年 - 寅月起戊寅; 丙辛年 - 寅月起庚寅; 丁壬年 - 寅月起壬寅; 戊癸年 - 寅月起甲寅
  const yearStemIdx = (year - 1984 + 1000) % 10;
  // 寅月天干基准（对应年干的余数0-4）
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
  // 寅月是月支第2位（branchIdx=2），从branchIdx=2开始，每增1月干+1
  const monthOffset = (branchIdx - 2 + 12) % 12;
  const stemIdx = (baseMonthStem + monthOffset) % 10;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch,
  };
}

// 日干支：以1900年1月31日=甲戌日为基准
// 甲戌：甲=0，戌=10
const BASE_DATE = new Date(1900, 0, 31); // 1900-01-31 (月份0-indexed)
const BASE_STEM_IDX = 0;   // 甲
const BASE_BRANCH_IDX = 10; // 戌

export function getDayGanzhi(date: Date): { stem: HeavenlyStem; branch: EarthlyBranch } {
  // 计算距离基准日的天数
  const msPerDay = 24 * 60 * 60 * 1000;
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.round((startOfDate.getTime() - BASE_DATE.getTime()) / msPerDay);
  const stemIdx = ((BASE_STEM_IDX + diff) % 10 + 10) % 10;
  const branchIdx = ((BASE_BRANCH_IDX + diff) % 12 + 12) % 12;
  return {
    stem: HEAVENLY_STEMS[stemIdx],
    branch: EARTHLY_BRANCHES[branchIdx],
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
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();

  const yearGz = getYearGanzhi(year);
  const monthGz = getMonthGanzhi(year, month, day);
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
