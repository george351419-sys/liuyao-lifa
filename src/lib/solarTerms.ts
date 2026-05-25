// 节气精确时刻计算（基于 Meeus 简化版太阳视黄经公式）
// 24 节气按太阳视黄经每 15° 划分；八字排盘以 12 个"节"切换月柱：
//   立春(315°) 惊蛰(345°) 清明(15°) 立夏(45°) 芒种(75°) 小暑(105°)
//   立秋(135°) 白露(165°) 寒露(195°) 立冬(225°) 大雪(255°) 小寒(285°)
//
// 输入/输出时间约定：所有 Date 都按北京时间（UT+8）处理，与公历输入保持一致。

const DEG = Math.PI / 180;

// 公历日期 → 儒略日（UT）
function calendarToJDUT(year: number, month: number, day: number, hour = 0, minute = 0, second = 0): number {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const dayFrac = day + (hour + minute / 60 + second / 3600) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + dayFrac + B - 1524.5;
}

// 儒略日（UT）→ 北京时间公历日期
function jdUTToBeijingDate(jdUT: number): { year: number; month: number; day: number; hour: number; minute: number; second: number } {
  const jd = jdUT + 8 / 24 + 0.5;
  const Z = Math.floor(jd);
  const F = jd - Z;
  let A: number;
  if (Z < 2299161) {
    A = Z;
  } else {
    const alpha = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + alpha - Math.floor(alpha / 4);
  }
  const B = A + 1524;
  const C = Math.floor((B - 122.1) / 365.25);
  const D = Math.floor(365.25 * C);
  const E = Math.floor((B - D) / 30.6001);
  const dayWithFrac = B - D - Math.floor(30.6001 * E) + F;
  const day = Math.floor(dayWithFrac);
  const totalSeconds = Math.round((dayWithFrac - day) * 86400);
  const hour = Math.floor(totalSeconds / 3600);
  const minute = Math.floor((totalSeconds % 3600) / 60);
  const second = totalSeconds % 60;
  const month = (E < 14) ? E - 1 : E - 13;
  const year = (month > 2) ? C - 4716 : C - 4715;
  return { year, month, day, hour, minute, second };
}

// ΔT (TT - UT) 秒：1900-2100 年范围内的经验拟合
function deltaT(year: number): number {
  const y = year - 2000;
  return 62.92 + 0.32217 * y + 0.005589 * y * y;
}

// 太阳视黄经（度），输入儒略日（TT）
function solarApparentLongitude(jdTT: number): number {
  const T = (jdTT - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const MDeg = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const M = MDeg * DEG;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
          + 0.000289 * Math.sin(3 * M);
  const trueLong = L0 + C;
  const omega = (125.04 - 1934.136 * T) * DEG;
  const apparent = trueLong - 0.00569 - 0.00478 * Math.sin(omega);
  return ((apparent % 360) + 360) % 360;
}

// 求指定公历年份中、太阳视黄经达到 targetLong（度）的儒略日（UT）
// 适用范围：targetLong ∈ [0, 360)；该节气必须落在 year 这一公历年内
function findSolarTermJDUT(year: number, targetLong: number): number {
  // 估计起始 JD：小寒(285°)≈1/5, 立春(315°)≈2/4, ..., 大雪(255°)≈12/6
  const approxDoy = 5 + ((targetLong - 285 + 360) % 360) / 360 * 365.25;
  let jd = calendarToJDUT(year, 1, 1, 0, 0, 0) + approxDoy;

  // Newton 迭代（太阳速度 ≈ 360°/365.25 天）
  for (let i = 0; i < 12; i++) {
    const lon = solarApparentLongitude(jd);
    let diff = targetLong - lon;
    diff = ((diff + 540) % 360) - 180;
    if (Math.abs(diff) < 1e-7) break;
    jd += diff * 365.25 / 360;
  }
  // 公式给出的是 TT 时间，需要转回 UT
  jd -= deltaT(year) / 86400;
  return jd;
}

// 获取指定公历年份的某节气北京时间 Date
export function getSolarTermDate(year: number, targetLong: number): Date {
  const jdUT = findSolarTermJDUT(year, targetLong);
  const bj = jdUTToBeijingDate(jdUT);
  return new Date(bj.year, bj.month - 1, bj.day, bj.hour, bj.minute, bj.second);
}

// 12 节（按公历年内时间顺序）→ 对应月支索引
// 月支：0=子, 1=丑, 2=寅, ..., 11=亥
export const JIE_QI_CHRONOLOGICAL: { long: number; monthBranchIdx: number; name: string }[] = [
  { long: 285, monthBranchIdx: 1,  name: '小寒' },  // ≈1月初  → 丑月
  { long: 315, monthBranchIdx: 2,  name: '立春' },  // ≈2月初  → 寅月（同时也是新年开端）
  { long: 345, monthBranchIdx: 3,  name: '惊蛰' },  // ≈3月初  → 卯月
  { long:  15, monthBranchIdx: 4,  name: '清明' },  // ≈4月初  → 辰月
  { long:  45, monthBranchIdx: 5,  name: '立夏' },  // ≈5月初  → 巳月
  { long:  75, monthBranchIdx: 6,  name: '芒种' },  // ≈6月初  → 午月
  { long: 105, monthBranchIdx: 7,  name: '小暑' },  // ≈7月初  → 未月
  { long: 135, monthBranchIdx: 8,  name: '立秋' },  // ≈8月初  → 申月
  { long: 165, monthBranchIdx: 9,  name: '白露' },  // ≈9月初  → 酉月
  { long: 195, monthBranchIdx: 10, name: '寒露' },  // ≈10月初 → 戌月
  { long: 225, monthBranchIdx: 11, name: '立冬' },  // ≈11月初 → 亥月
  { long: 255, monthBranchIdx: 0,  name: '大雪' },  // ≈12月初 → 子月
];

// 给定日期，找到它之前最近的一个"节"，返回月支索引与所属公历年
// 用于判定月柱（八字 / 六爻中的"月建"切换）
export function findGoverningJie(date: Date): { monthBranchIdx: number; jieYear: number } {
  const year = date.getFullYear();

  // 当年所有 12 个节
  const cur = JIE_QI_CHRONOLOGICAL.map(t => ({
    ...t,
    date: getSolarTermDate(year, t.long),
  }));

  // 若早于本年小寒，则归到上一年的大雪
  if (date < cur[0].date) {
    const prevDaXue = getSolarTermDate(year - 1, 255);
    return { monthBranchIdx: 0, jieYear: prevDaXue.getFullYear() };
  }

  // 否则取最后一个 <= date 的节
  for (let i = cur.length - 1; i >= 0; i--) {
    if (date >= cur[i].date) {
      return { monthBranchIdx: cur[i].monthBranchIdx, jieYear: year };
    }
  }
  // 理论不到这里
  return { monthBranchIdx: 0, jieYear: year };
}

// 给定日期，返回对应的"农历年份"（以立春为界，用于年柱计算）
export function getLunarYear(date: Date): number {
  const year = date.getFullYear();
  const lichun = getSolarTermDate(year, 315);
  return date < lichun ? year - 1 : year;
}
