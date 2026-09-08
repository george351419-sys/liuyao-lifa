# 六爻计分排盘

一个基于 **React + TypeScript + Vite** 的六爻（纳甲筮法）自动排盘与吉凶判断工具。输入起卦时间与摇卦数据，自动完成干支推演、装卦、安世应、排六亲六神、定用神、动爻/变爻分析、入墓旬空等特殊状态标注，并输出综合吉凶判断。

## 功能特性

- **多种起卦方式**
  - 现代硬币摇卦（6 位数字，每位 0-3）
  - 古代钱币摇卦（背面/字面计数）
  - 起数法（两个整数定上/下卦）
  - 手动输入爻型
- **自动排盘**
  - 年月日时干支推演，含月建旬空 / 日辰旬空
  - 装卦、安世应、排六亲、起六神
  - 本卦 / 变卦（含变爻六亲、地支、阴阳）
- **特殊状态标注**
  - 旬空（月建 / 日辰，本爻与变爻均考虑）
  - 月破 / 日破、月合 / 日合、暗动
  - 入墓（月 / 日 / 动 / 化 / 飞）、伏神
  - 反吟 / 伏吟、回头生克、化进 / 化退 / 化绝 / 化破
- **能量计分**
  - 依据月建 / 日辰旺相休囚对每爻计分
  - 用神与世爻先天能量分析
- **动爻分析**
  - 多动爻选取算法：平均原则 / 能量优先 / 关系优先
  - 三合局、动动相生链、相生闭环识别
- **吉凶判断**
  - 世用关系六大类型（生 / 克 / 比和 / 持世）
  - 综合吉凶 6 级定性（大吉 / 小吉 / 平吉 / 平凶 / 小凶 / 大凶）
- **历史记录**
  - 本地持久化（`localStorage`），保存事项、起卦数据、吉凶结论
  - 事后反馈（准 / 不准）与应验情况记录，支持编辑、删除

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

启动后访问终端提示的本地地址（默认 `http://localhost:5173`）。

### 生产构建

```bash
npm run build
```

### 预览构建产物

```bash
npm run preview
```

## 技术栈

- **React 19** + **TypeScript**
- **Vite 8** 构建
- Tailwind CSS + 自定义 CSS 变量主题
- 纯前端，无后端依赖，数据存储于浏览器 `localStorage`

## 目录结构

```
src/
├── components/        # 界面组件（表单、排盘、判断、历史）
│   ├── InputForm.tsx      # 起卦输入表单
│   ├── GanzhiBar.tsx      # 干支信息栏
│   ├── HexagramBoard.tsx  # 卦盘（六爻行、图例）
│   ├── YaoRow.tsx         # 单爻行渲染
│   ├── JudgmentPanel.tsx  # 吉凶判断面板
│   └── HistoryView.tsx    # 历史记录视图
├── lib/               # 核心算法
│   ├── ganzhi.ts          # 干支推演与旬空计算
│   ├── divination.ts      # 起卦方式（硬币/起数法）
│   ├── hexagram.ts        # 排盘主流程
│   ├── changed.ts         # 变爻特殊状态判定
│   ├── dongYaoSelector.ts # 多动爻选取算法
│   ├── special.ts         # 旬空/破/合/暗动等标注
│   ├── sanhe.ts           # 三合局
│   ├── judgment.ts        # 吉凶综合判断
│   └── historyStore.ts    # 历史记录持久化
├── data/              # 静态数据（六十四卦、纳甲、计分表等）
│   ├── hexagrams.ts
│   ├── hexagramDetails.ts
│   ├── constants.ts
│   ├── scoreTables.ts
│   └── worldYongTable.ts
├── types/             # TypeScript 类型定义
└── App.tsx            # 应用入口
```

## 部署

项目已配置 [Vercel](https://vercel.com)（见 `vercel.json`）：

- 构建命令：`npm run build`
- 输出目录：`dist`
- 框架：Vite

也可构建 `dist/` 后部署至任意静态托管服务。

## 许可

仅供学习与研究用途。
