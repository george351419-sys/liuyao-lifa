// 天干
export const HEAVENLY_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'] as const;
export type HeavenlyStem = typeof HEAVENLY_STEMS[number];

// 地支
export const EARTHLY_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'] as const;
export type EarthlyBranch = typeof EARTHLY_BRANCHES[number];

// 地支索引（0-11，子=0）
export const BRANCH_INDEX: Record<EarthlyBranch, number> = {
  '子':0,'丑':1,'寅':2,'卯':3,'辰':4,'巳':5,'午':6,'未':7,'申':8,'酉':9,'戌':10,'亥':11
};

// 五行
export const ELEMENTS = ['水','土','木','木','土','火','火','土','金','金','土','水'] as const;
export const BRANCH_ELEMENT: Record<EarthlyBranch, string> = {
  '子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'
};

// 地支五行简字
export const BRANCH_LABEL: Record<EarthlyBranch, string> = {
  '子':'子水','丑':'丑土','寅':'寅木','卯':'卯木','辰':'辰土','巳':'巳火','午':'午火','未':'未土','申':'申金','酉':'酉金','戌':'戌土','亥':'亥水'
};

// 六冲（index差6）
export const CHONG_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥','午':'子','未':'丑','申':'寅','酉':'卯','戌':'辰','亥':'巳'
};

// 六合
export const HE_MAP: Record<EarthlyBranch, EarthlyBranch> = {
  '子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'
};

// 天干五行
export const STEM_ELEMENT: Record<HeavenlyStem, string> = {
  '甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'
};

// 天干阴阳
export const STEM_YIN_YANG: Record<HeavenlyStem, 'yang'|'yin'> = {
  '甲':'yang','乙':'yin','丙':'yang','丁':'yin','戊':'yang','己':'yin','庚':'yang','辛':'yin','壬':'yang','癸':'yin'
};

// 地支阴阳
export const BRANCH_YIN_YANG: Record<EarthlyBranch, 'yang'|'yin'> = {
  '子':'yang','丑':'yin','寅':'yang','卯':'yin','辰':'yang','巳':'yin','午':'yang','未':'yin','申':'yang','酉':'yin','戌':'yang','亥':'yin'
};

// 五行相生（生者→被生者）
export const SHENG_MAP: Record<string, string> = {
  '木':'火','火':'土','土':'金','金':'水','水':'木'
};

// 五行相克（克者→被克者）
export const KE_MAP: Record<string, string> = {
  '木':'土','土':'水','水':'火','火':'金','金':'木'
};

// 十二长生绝地（五行→绝地支）
export const JUE_DI: Record<string, EarthlyBranch> = {
  '木':'申','火':'亥','金':'寅','水':'巳','土':'巳'
};

// 四库（墓库地支）
export const MU_KU: Record<string, EarthlyBranch> = {
  '土':'辰','水':'辰','木':'未','火':'戌','金':'丑'
};

// 化进/化退关系
export const HUA_JIN: Record<EarthlyBranch, EarthlyBranch> = {
  '寅':'卯','申':'酉','未':'戌','丑':'辰',
  '卯':'寅','酉':'申','戌':'未','辰':'丑', // 占位，实际化退用反向
  '子':'子','午':'午','巳':'巳','亥':'亥' // 无化进关系的地支
};
// 严格化进（顺序）
export const HUA_JIN_MAP: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '寅':'卯','申':'酉','未':'戌','丑':'辰'
};
// 严格化退（逆序）
export const HUA_TUI_MAP: Partial<Record<EarthlyBranch, EarthlyBranch>> = {
  '卯':'寅','酉':'申','戌':'未','辰':'丑'
};

// 六爻爻位名称
export const YAO_NAMES = ['初爻','二爻','三爻','四爻','五爻','上爻'] as const;

// 六神顺序（从一爻到六爻，根据日天干从青龙开始）
// 日干对应六神起点
export const LIUSHEN_START: Record<HeavenlyStem, number> = {
  '甲':0,'乙':0,'丙':1,'丁':1,'戊':2,'己':2,'庚':3,'辛':3,'壬':4,'癸':4
};
export const LIUSHEN_NAMES = ['青龙','朱雀','勾陈','腾蛇','白虎','玄武'] as const;

// 六亲（五行关系：以日主五行为参照）
export const SIX_RELATIVES = ['父母','兄弟','妻财','子孙','官鬼'] as const;
export type SixRelative = '父母'|'兄弟'|'妻财'|'子孙'|'官鬼';

// 六亲对应咨询类别
export const CATEGORY_TO_RELATIVE: Record<string, SixRelative> = {
  '妻财':'妻财','官鬼':'官鬼','父母':'父母','子孙':'子孙','兄弟':'兄弟'
};

// 六亲 tooltip 解释
export const CATEGORY_TIPS: Record<string, string> = {
  '父母': '父母、长辈、老师、老人；房、衣服、雨伞；文书、合同、成绩；信息、消息、车辆、飞机；下雨、雨雪',
  '子孙': '儿女、晚辈、徒弟、下属；医生、医药、救治；忠臣、正神；动物；娱乐、开心、顺利；财源、客户、产品',
  '兄弟': '兄弟姐妹、同辈、同事、朋友；替代品；同行、竞争者；破耗、花费、损失；阻碍；风云',
  '妻财': '妻子、情人、女友、对象；钱财；私人物品、贵重物品；饮食、酒水',
  '官鬼': '官方、领导；男友、丈夫、情人；小偷、犯罪分子；疾病、灾祸；事业、工作；疑惑、担心；鬼神、尸体'
};

// 世爻/应爻位置（按卦的变体，六十四卦通用规则）
// 规则：以上卦和下卦的宫位确定世爻（标准六爻宫位法）
// 八纯卦世爻在六爻，一世卦在一爻...以此类推
// 此处用六爻标准世应对照
// 索引0=一爻，索引5=六爻
// 世爻位置 [世, 应]（0-indexed）
// 实现见 hexagrams.ts 的每卦定义
