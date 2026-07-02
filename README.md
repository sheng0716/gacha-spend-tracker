# 🎮 二游消费记录 (Gacha Spend Tracker)

记录二次元手游充值，自动按**下单当天的中间汇率**把日元(JPY)/台币(TWD)/韩元(KRW)等换算成
**马币 MYR**（你用 Wise 虚拟卡付款的基准货币），可逐笔改成 Wise 账单上的实际扣款额。
手机/电脑都能用。

- 前端：React + Vite + TypeScript（图表用 Recharts）
- 后端：Supabase（托管数据库 + 登录 + 行级安全 RLS），**不用自己写服务器**
- 汇率：浏览器端调 [fawazahmed0 currency-api](https://github.com/fawazahmed0/exchange-api)（免费、无 key、按天历史）

---

## 快速预览（不连数据库）

```bash
npm install
npm run dev
```

浏览器开 **http://localhost:5173/?demo=1** —— 用内置示例数据预览界面（增删改只在本地，不保存）。
去掉 `?demo=1` 就是真实登录页。

> 本机若没装 Node：先 `winget install OpenJS.NodeJS.LTS`，重开终端再 `npm install`。

---

## 完整搭建（连真实数据，手机可访问）

### 1. 建 Supabase 项目
1. 去 https://supabase.com 注册、新建一个 project（免费档即可），记住数据库密码。
2. 项目建好后，左侧 **SQL Editor** → New query，把本仓库 `supabase/schema.sql` 全部内容粘进去 → **Run**。
   这会建 `purchases` 表并开启 RLS（每个账号只看自己的数据）。

### 2. 配置前端密钥
1. Supabase 左下 **Project Settings → API**：
   - 复制 **Project URL**
   - 复制 **anon public** key
2. 把本仓库 `.env.example` 复制成 `.env.local`，填进去：
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. `npm run dev`，开 http://localhost:5173 → **注册**一个账号（邮箱+密码）→ 登录。
   > 若注册后提示要验证邮箱：去 Supabase **Authentication → Providers → Email** 可关掉
   > “Confirm email”，或直接去邮箱点确认链接。

### 3. 导入现有 Excel 的 34 条记录（一次性）
1. 拿到你的 user id：Supabase **Authentication → Users**，复制你账号那行的 **UID**。
2. 装 Python 依赖并生成 SQL：
   ```bash
   pip install -r scripts/requirements.txt
   python scripts/import_excel.py <你的UID>
   # 默认读 C:\Users\jiesh\Downloads\In game purchase.xlsx
   # 也可：python scripts/import_excel.py <你的UID> "路径\xxx.xlsx"
   ```
   脚本会按每行下单日期取历史中间汇率算好 MYR，生成 `scripts/import.sql`。
3. 把 `scripts/import.sql` 内容粘到 Supabase **SQL Editor** → Run。回网站刷新即可看到。

> 说明：导入统一用**中间汇率**重算（`rate_source=auto`）。和 Wise 实际扣款会有小差异；
> 想精确的，进网站点某条记录的 ✏️，把 MYR 改成账单实际金额（会自动标记为“手动”）。
> 个别取不到汇率的行 MYR 先记 0，导入后手动补即可。

### 4. 部署上线（手机访问）
先打包：
```bash
npm run build      # 产出 dist/
```

**方式 A：Cloudflare Pages**
1. https://dash.cloudflare.com → Workers & Pages → Create → Pages。
2. 可直接 **Upload assets** 把 `dist/` 拖上去；或连 GitHub 仓库，构建命令 `npm run build`、输出目录 `dist`。
3. 若用“连 Git 自动构建”，在 Pages 项目的 **Settings → Environment variables** 里加
   `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`（拖 dist 上传则不需要，密钥已打包进静态文件）。

**方式 B：Netlify**
1. https://app.netlify.com → Add new site → **Deploy manually**，把 `dist/` 文件夹拖进去。
2. 自动构建同理：构建命令 `npm run build`，发布目录 `dist`，并在 Site settings 配两个 `VITE_` 环境变量。

部署完拿到一个网址（如 `xxx.pages.dev` / `xxx.netlify.app`），手机直接打开、登录即可。

> 安全说明：anon key 是**可公开**的，真正的数据安全由 Supabase 的 RLS 策略保证
> （`schema.sql` 已配好：只能读写自己 user_id 的行）。

---

## 功能
- 新增/编辑/删除记录；选日期+币种+金额后自动换算 MYR，可手改成实际扣款
- 列表：按游戏 / 币种 / 日期范围筛选，点表头排序
- 汇总：总花费、本月花费、按月柱状图、各游戏占比饼图
- 导出 CSV 备份

## 项目结构
```
src/
  App.tsx                主界面：登录态切换、增删改查、演示模式
  lib/
    supabase.ts          Supabase 客户端
    rates.ts             历史汇率取数（主源 jsDelivr + 备源回退）
    purchases.ts         purchases 表 CRUD
    currency.ts          币种/金额格式化
    csv.ts               CSV 导出
    demoData.ts          ?demo=1 的示例数据
  components/
    Auth.tsx  PurchaseForm.tsx  PurchaseList.tsx  Summary.tsx
supabase/schema.sql      建表 + RLS（粘到 Supabase 执行）
scripts/import_excel.py  Excel → import.sql 导入脚本
```

## 常用命令
```bash
npm run dev      # 本地开发
npm run build    # 打包到 dist/
npm run preview  # 本地预览打包结果
```
