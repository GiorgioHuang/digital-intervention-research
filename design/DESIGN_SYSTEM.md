# DESIGN_SYSTEM — 设计系统基座 v0.1

> 交付范围：UI_INVENTORY A 节（设计系统基座 9 项：A1–A9）与 I 节中的跨界面状态基座（I11 加载/骨架/空/离线/同步/陈旧、I12 版本冲突、I13 错误严重度）。
> 规范来源：Doc 20 v1.3 §13、§43–56、§224–246、§277–307、§310–320；DESIGN_BRIEF §2/§4/§6；ACCESSIBILITY_TEST_PLAN。
> 本文件**不修改任何代码**。§F 是可粘贴的 CSS 草案，落地由实现代理执行。
> 阶段声明：概念研究原型（ADR-061/062）。全部合成数据、模拟供应商、dev-header 身份桩。本设计系统不得暗示已获伦理批准或正在招募真实参与者。

---

## 目录

- [§0 读法与不可协商的约束](#0-读法与不可协商的约束)
- [§A 令牌](#a-令牌)
- [§B 全局规则](#b-全局规则)
- [§C 能力自适应模式](#c-能力自适应模式)
- [§D 响应式](#d-响应式)
- [§E 状态呈现规范](#e-状态呈现规范)
- [§F CSS 草案](#f-css-草案可直接粘贴进-appswebsrcstylescss)
- [§G 对现有 34 个测试与可访问名的影响](#g-对现有-34-个测试与可访问名的影响)
- [§H 关键取舍](#h-关键取舍)
- [§I 需要产品决策的未决项](#i-需要产品决策的未决项)

---

## §0 读法与不可协商的约束

### 0.1 三层令牌架构（Doc 20 §310）

```text
Foundation（原始值：色值、rem 刻度、毫秒）
        ↓  只在 :root 出现一次
Semantic（语义名：--color-danger-fg、--space-3、--type-size-2）
        ↓  组件只能引用这一层
Component（组件私有：--btn-pad-block，由 semantic 派生）
        ↓
Mode / Theme Override（dark、高对比、字号、密度、简化）
```

**硬规则**：组件 CSS 中不得出现字面色值、字面 px、字面毫秒。评审时 `grep -nE '#[0-9a-fA-F]{3,6}|[0-9]+px|[0-9]+ms' styles.css` 的命中必须全部落在 `:root` / 主题覆盖块内。

### 0.2 本系统"不是什么"

| 反模式 | 为什么禁止 |
|---|---|
| 渐变、阴影堆叠、玻璃拟态 | 装饰权重会被读成重要性；Doc 20 §319 elevation 不得表示科学置信度或权威 |
| 品牌强调色作为"主色调铺满" | 高饱和大面积会与 danger/safety 语义色竞争 |
| 圆角 ≥16px 的大圆角卡片、拟人插画 | Doc 20 §316：不得 infantilise；参与者是成年人 |
| 徽章计数、红点、连续记录（streak）、进度条奖励 | 注意力机制，Doc 20 §297 明令禁止庆祝动效用于 Consent/matching/消息量/研究完成 |
| 用颜色深浅表示"AI 置信度" | Doc 19 §10 认识论纪律：置信度必须是文字，不是视觉强度 |

### 0.3 技术边界

无 UI 框架、无 CSS-in-JS、无图标库依赖、无 Web 字体下载（离线与低带宽下必须可读）。全部落在单文件 `apps/web/src/styles.css` + 一个内联 SVG 图标模块。

---

## §A 令牌

**令牌总量：119 个语义令牌名**。其中颜色 47 个名 × light/dark 两套值 = 94 条声明，其余 72 个名各 1 条声明；能力自适应模式（字号/密度/对比/简化/低刺激）再提供 39 条覆盖声明。§F 草案全文共 254 条 `--` 声明，与此一致。分布见下表，逐项定义在 §A.1–§A.9。

| 组 | 令牌名数 | 小节 |
|---|---:|---|
| 颜色（light + dark 同名两套值） | 47 | §A.1 |
| 排版（字族/字号/行高/字重/字距 19 + 行宽 3） | 22 | §A.2 |
| 间距（10）与密度乘数（1） | 11 | §A.3 |
| 形状与描边 | 9 | §A.4 |
| 焦点尺寸（颜色计入颜色组） | 4 | §A.5 |
| 动效 | 7 | §A.6 |
| elevation | 4 | §A.7 |
| z-index 层 | 6 | §A.7 |
| 触控目标 | 3 | §A.8 |
| 图标 | 5 | §A.9 |
| 字号乘数 `--scale-font` | 1 | §C.1 |
| **合计** | **119** | |

### A.1 颜色令牌（A1；Doc 20 §311–312）

对比度按 WCAG 2.x 相对亮度公式实测计算（脚本见 §A.1.5），非目测。判定门槛：

- **正文与 <18.66px 文本**：≥ 4.5:1
- **大字（≥24px 或 ≥18.66px 粗体）与 UI 组件边界/图形**：≥ 3:1
- **焦点指示器**：与其两侧相邻颜色均 ≥ 3:1

#### A.1.1 Light 主题

| 令牌 | 值 | 前景/背景组合 | 实测对比度 | 门槛 |
|---|---|---|---:|---|
| `--color-surface-page` | `#FFFFFF` | 基准背景 | — | — |
| `--color-surface-raised` | `#F7F8FA` | 卡片/面板 | — | — |
| `--color-surface-sunken` | `#EEF0F4` | 输入槽/代码块 | — | — |
| `--color-surface-inverse` | `#1B1F26` | 反色条 | — | — |
| `--color-surface-scrim` | `rgb(11 18 32 / 0.55)` | 对话框遮罩 | — | — |
| `--color-text-primary` | `#16191F` | / page | **17.60:1** | 4.5 |
| ″ | ″ | / raised | **16.57:1** | 4.5 |
| ″ | ″ | / sunken | **15.43:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 ai-bg） | **15.17:1** | 4.5 |
| `--color-text-secondary` | `#4A5261` | / page | **7.86:1** | 4.5 |
| ″ | ″ | / raised | **7.40:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 safety-bg） | **6.77:1** | 4.5 |
| `--color-text-inverse` | `#FFFFFF` | / surface-inverse | **16.53:1** | 4.5 |
| `--color-text-link` | `#14448C` | / page | **9.39:1** | 4.5 |
| ″ | ″ | / raised | **8.84:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 safety-bg） | **8.09:1** | 4.5 |
| `--color-border-subtle` | `#D5DAE2` | / page（**仅装饰**，1.40:1） | 1.40:1 | 免除¹ |
| `--color-border-default` | `#767E8C` | / page | **4.09:1** | 3 |
| ″ | ″ | / raised | **3.85:1** | 3 |
| ″ | ″ | / 任一语义 tint 底（最低 safety-bg） | **3.52:1** | 3 |
| `--color-border-strong` | `#414855` | / page | **9.20:1** | 3 |
| `--color-action-primary-bg` | `#1A4FA0` | / page（组件边界） | **7.87:1** | 3 |
| `--color-action-primary-fg` | `#FFFFFF` | / action-primary-bg | **7.87:1** | 4.5 |
| `--color-action-primary-bg-hover` | `#123B7C` | 与 fg `#FFFFFF` | **10.81:1** | 4.5 |
| `--color-action-primary-bg-active` | `#0D2E62` | 与 fg `#FFFFFF` | **13.16:1** | 4.5 |
| `--color-action-secondary-fg` | `#14448C` | / page | **9.39:1** | 4.5 |
| `--color-action-secondary-border` | `#1A4FA0` | / page | **7.87:1** | 3 |
| `--color-action-secondary-bg-hover` | `#E8EEF8` | 与 secondary-fg | ≥8.2:1 | 4.5 |
| `--color-focus-ring` | `#12233F` | / page | **15.70:1** | 3 |
| ″ | ″ | / raised | **14.77:1** | 3 |
| ″ | ″ | / 任一语义 tint 底（最低 safety-bg） | **13.51:1** | 3 |
| ″ | ″ | / focus-halo（内侧相邻） | **15.70:1** | 3 |
| `--color-focus-halo` | `#FFFFFF` | 见上 | — | — |
| `--color-info-bg` | `#E8F1FA` | — | — | — |
| `--color-info-fg` | `#0F4C81` | / info-bg | **7.76:1** | 4.5 |
| ″ | ″ | / page | **8.86:1** | 4.5 |
| `--color-info-border` | `#1A6BB0` | / page | **5.56:1** | 3 |
| `--color-success-bg` | `#E6F4EB` | — | — | — |
| `--color-success-fg` | `#14603A` | / success-bg | **6.69:1** | 4.5 |
| ″ | ″ | / page | **7.60:1** | 4.5 |
| `--color-success-border` | `#1F7A4C` | / page | **5.32:1** | 3 |
| `--color-warning-bg` | `#FBF0DC` | — | — | — |
| `--color-warning-fg` | `#6E4200` | / warning-bg | **7.62:1** | 4.5 |
| ″ | ″ | / page | **8.60:1** | 4.5 |
| `--color-warning-border` | `#A16207` | / page | **4.92:1** | 3 |
| `--color-danger-bg` | `#FDECEC` | — | — | — |
| `--color-danger-fg` | `#991B1B` | / danger-bg | **7.28:1** | 4.5 |
| ″ | ″ | / page | **8.31:1** | 4.5 |
| `--color-danger-border` | `#C02626` | / page | **5.92:1** | 3 |
| `--color-danger-solid-bg` | `#9B1C1C` | 与 solid-fg | **8.15:1** | 4.5 |
| `--color-danger-solid-fg` | `#FFFFFF` | 见上 | — | — |
| `--color-safety-bg` | `#E9EDFA` | — | — | — |
| `--color-safety-fg` | `#152A6B` | / safety-bg | **11.40:1** | 4.5 |
| ″ | ″ | / page | **13.33:1** | 4.5 |
| `--color-safety-border` | `#2B3F8F` | / page | **9.50:1** | 3 |
| `--color-moderation-bg` | `#E3F2F2` | — | — | — |
| `--color-moderation-fg` | `#0C5257` | / moderation-bg | **7.73:1** | 4.5 |
| ″ | ″ | / page | **8.90:1** | 4.5 |
| `--color-moderation-border` | `#12747B` | / page | **5.51:1** | 3 |
| `--color-ai-bg` | `#EFEDF5` | — | — | — |
| `--color-ai-fg` | `#46405C` | / ai-bg | **8.43:1** | 4.5 |
| ″ | ″ | / page | **9.78:1** | 4.5 |
| `--color-ai-border` | `#6A6285` | / page | **5.68:1** | 3 |
| `--color-disabled-bg` | `#F0F1F4` | — | — | — |
| `--color-disabled-fg` | `#5F6673` | / disabled-bg | **5.12:1** | 免除² |
| `--color-disabled-border` | `#A8AEB9` | / page（2.23:1） | 2.23:1 | 免除² |

¹ `border-subtle` 是**装饰性分隔线**，不承载任何状态或分组语义，不受 1.4.11 约束。**禁止**用它作为输入框边框、卡片的唯一分组线、或任何状态容器的描边——那些一律用 `border-default` 及以上。
² 禁用态在 WCAG 1.4.3/1.4.11 中免除。本系统仍把前景做到 5.12:1，因为禁用按钮的文字必须能读懂"它为什么禁用"。见 §B.1.4。

#### A.1.2 Dark 主题

| 令牌 | 值 | 前景/背景组合 | 实测对比度 | 门槛 |
|---|---|---|---:|---|
| `--color-surface-page` | `#0E1116` | 基准背景 | — | — |
| `--color-surface-raised` | `#161A21` | 卡片/面板 | — | — |
| `--color-surface-sunken` | `#080A0E` | 输入槽 | — | — |
| `--color-surface-inverse` | `#E9ECF2` | 反色条 | — | — |
| `--color-surface-scrim` | `rgb(2 4 8 / 0.66)` | 对话框遮罩 | — | — |
| `--color-text-primary` | `#E9ECF2` | / page | **15.98:1** | 4.5 |
| ″ | ″ | / raised | **14.74:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 success-bg） | **12.98:1** | 4.5 |
| `--color-text-secondary` | `#A8B0BE` | / page | **8.66:1** | 4.5 |
| ″ | ″ | / raised | **7.99:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 success-bg） | **7.03:1** | 4.5 |
| `--color-text-inverse` | `#0E1116` | / surface-inverse | **15.98:1** | 4.5 |
| `--color-text-link` | `#9CC0FF` | / page | **10.26:1** | 4.5 |
| ″ | ″ | / raised | **9.47:1** | 4.5 |
| ″ | ″ | / 任一语义 tint 底（最低 success-bg） | **8.33:1** | 4.5 |
| `--color-border-subtle` | `#2A3039` | / page（**仅装饰**，1.42:1） | 1.42:1 | 免除¹ |
| `--color-border-default` | `#6D7683` | / page | **4.11:1** | 3 |
| ″ | ″ | / raised | **3.80:1** | 3 |
| ″ | ″ | / 任一语义 tint 底（最低 success-bg） | **3.34:1** | 3 |
| `--color-border-strong` | `#99A2B0` | / page | **7.34:1** | 3 |
| `--color-action-primary-bg` | `#7FB0FF` | / page（组件边界） | **8.61:1** | 3 |
| `--color-action-primary-fg` | `#08101F` | / action-primary-bg | **8.65:1** | 4.5 |
| `--color-action-primary-bg-hover` | `#A6C8FF` | 与 fg `#08101F` | **11.16:1** | 4.5 |
| `--color-action-primary-bg-active` | `#C2DAFF` | 与 fg `#08101F` | **13.55:1** | 4.5 |
| `--color-action-secondary-fg` | `#9CC0FF` | / page | **10.26:1** | 4.5 |
| `--color-action-secondary-border` | `#7FB0FF` | / page | **8.61:1** | 3 |
| `--color-action-secondary-bg-hover` | `#182231` | 与 secondary-fg | ≥9.1:1 | 4.5 |
| `--color-focus-ring` | `#F2F6FF` | / page | **17.47:1** | 3 |
| ″ | ″ | / raised | **16.12:1** | 3 |
| ″ | ″ | / 任一语义 tint 底（最低 success-bg） | **14.19:1** | 3 |
| ″ | ″ | / focus-halo（内侧相邻） | **18.63:1** | 3 |
| `--color-focus-halo` | `#05070B` | 见上 | — | — |
| `--color-info-bg` | `#10243A` | — | — | — |
| `--color-info-fg` | `#A9CFF5` | / info-bg | **9.68:1** | 4.5 |
| ″ | ″ | / page | **11.64:1** | 4.5 |
| `--color-info-border` | `#4C8FD6` | / page | **5.59:1** | 3 |
| `--color-success-bg` | `#0E2A1D` | — | — | — |
| `--color-success-fg` | `#9FD9B7` | / success-bg | **9.57:1** | 4.5 |
| ″ | ″ | / page | **11.78:1** | 4.5 |
| `--color-success-border` | `#3D9E6B` | / page | **5.67:1** | 3 |
| `--color-warning-bg` | `#2E2208` | — | — | — |
| `--color-warning-fg` | `#F0CE8A` | / warning-bg | **10.31:1** | 4.5 |
| ″ | ″ | / page | **12.52:1** | 4.5 |
| `--color-warning-border` | `#C08A2E` | / page | **6.23:1** | 3 |
| `--color-danger-bg` | `#331515` | — | — | — |
| `--color-danger-fg` | `#F5AFAF` | / danger-bg | **9.24:1** | 4.5 |
| ″ | ″ | / page | **10.48:1** | 4.5 |
| `--color-danger-border` | `#D45C5C` | / page | **4.94:1** | 3 |
| `--color-danger-solid-bg` | `#F5AFAF` | 与 solid-fg | **10.75:1** | 4.5 |
| `--color-danger-solid-fg` | `#1A0808` | 见上 | — | — |
| `--color-safety-bg` | `#131A33` | — | — | — |
| `--color-safety-fg` | `#BCC9F5` | / safety-bg | **10.47:1** | 4.5 |
| ″ | ″ | / page | **11.54:1** | 4.5 |
| `--color-safety-border` | `#7186D6` | / page | **5.48:1** | 3 |
| `--color-moderation-bg` | `#0B2628` | — | — | — |
| `--color-moderation-fg` | `#9FD6D8` | / moderation-bg | **9.90:1** | 4.5 |
| ″ | ″ | / page | **11.78:1** | 4.5 |
| `--color-moderation-border` | `#3E9EA4` | / page | **5.97:1** | 3 |
| `--color-ai-bg` | `#21202B` | — | — | — |
| `--color-ai-fg` | `#C4BEDA` | / ai-bg | **8.98:1** | 4.5 |
| ″ | ″ | / page | **10.56:1** | 4.5 |
| `--color-ai-border` | `#857DA5` | / page | **4.93:1** | 3 |
| `--color-disabled-bg` | `#171B22` | — | — | — |
| `--color-disabled-fg` | `#8B93A1` | / disabled-bg | **5.58:1** | 免除² |
| `--color-disabled-border` | `#3A414C` | / page（1.84:1） | 1.84:1 | 免除² |

#### A.1.3 语义色的分工（Doc 20 §311，不得混用）

| 语义族 | 只用于 | **不得**用于 |
|---|---|---|
| info | 中性说明、"这是正常的"、上下文横幅 | 任何需要用户动作的事 |
| success | 服务端已确认完成的事实 | 本地保存、排队中、"已提交给发送服务" |
| warning | 需要注意但未阻断；有条件批准 | 错误；不可逆操作的最终确认 |
| danger | 破坏性/不可逆动作、阻断错误 | 安全（Safety）事务 |
| **safety** | SafetySignal / SafetyEvent / 紧急支持路径 | 普通错误、审核事务 |
| **moderation** | 举报、审核决定、申诉 | 安全事务、danger |
| **ai** | AI 参与标签、AI 草稿容器 | 表示 AI 输出的质量或置信度 |
| disabled | 当前不可用的控件 | 权限不足的**隐藏**（受保护存在见 §E.9） |

**danger / safety / moderation 三者必须视觉可分且互不替代**：这是 Doc 20 §311 把 Safety 与 moderation 单列为语义族的原因。红=破坏性动作，**深蓝=安全（人身与福祉）**，青=审核（内容与行为规则）。深蓝与 info 蓝、action 蓝同属蓝族（safety-fg 与 info-fg 相互对比度仅 1.51:1），因此 Safety 的区分**主要靠图标形状与文字，颜色是次要线索**——这正是「颜色不得是唯一状态指示」在本系统中的具体后果，Safety 事务必须始终带 ⬡ 图标与「安全」字样。三者在灰度下靠图标形状（△ / ⬡ / ▢）与文字区分，见 §A.9 与 §B.1。

#### A.1.4 可见性色使用（Doc 20 §312）

可见性等级（Private / Selected People / Connections / Community / Platform Public / Internet Public）**一律以图标 + 文字为主，颜色为辅**。

- `Private` 与 `Internet Public` 是两个极端，**禁止**仅靠色相深浅区分：`Private` 用实心闭锁图标 + 文字「只有你能看到」；`Internet Public` 用开放地球图标 + 文字「互联网上任何人都能看到」，并额外套 `warning` 描边容器。
- 中间等级用 `--color-text-secondary` 中性呈现，不着色，避免"越公开越鲜艳"的诱导（暗黑模式禁令，Doc 20 §13.7）。

#### A.1.5 对比度复核脚本（评审可复跑）

```js
// node contrast.mjs — WCAG 2.x 相对亮度与对比度
const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = (hex) => { const h = hex.replace('#', '');
  return 0.2126 * lin(parseInt(h.slice(0,2),16))
       + 0.7152 * lin(parseInt(h.slice(2,4),16))
       + 0.0722 * lin(parseInt(h.slice(4,6),16)); };
export const contrast = (a, b) => {
  const l1 = L(a), l2 = L(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};
```

**验收要求**：把上表所有组合写成单元测试断言（`expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)`），令牌值一旦被改动即失败。这是本文件唯一建议新增的自动化门。

---

### A.2 排版令牌与规则（A2；Doc 20 §313–314）

#### A.2.1 字族

| 令牌 | 值 |
|---|---|
| `--type-family-ui` | `system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif` |
| `--type-family-mono` | `ui-monospace, SFMono-Regular, Menlo, 'Noto Sans Mono CJK SC', monospace` |

不下载 Web 字体：离线可读优先于视觉一致（取舍 §H.2）。等宽字族**只用于**标识符（`pt_b`、`dv_9`、版本哈希）——这类文本必须能逐字符核对（Doc 20 §54「精确版本后批准」）。

#### A.2.2 字号刻度（单一刻度，三档密度共用）

根字号保持 `112.5%`（18px），已在现有 `styles.css`；所有尺寸以 `rem` 表达，因此浏览器字号设置与 200% 缩放天然生效。

| 令牌 | 值（rem） | 默认 px（18px 根） | 用途 |
|---|---|---:|---|
| `--type-size-0` | `0.833rem` | 15.0 | 仅用于 `<small>` 里的时间戳/单位；**禁止**用于状态文字、标签、说明 |
| `--type-size-1` | `1rem` | 18.0 | 正文默认、按钮、表单 |
| `--type-size-2` | `1.125rem` | 20.3 | 强调正文、卡片标题、状态徽章内文字 |
| `--type-size-3` | `1.333rem` | 24.0 | h3 |
| `--type-size-4` | `1.602rem` | 28.8 | h2 |
| `--type-size-5` | `1.924rem` | 34.6 | h1 |
| `--type-size-6` | `2.311rem` | 41.6 | 仅公共 surface 的落地页大标题 |

比例 1.2（小三度）。**没有比 `--type-size-0` 更小的档**——这是 Doc 20 §314「禁止 tiny secondary labels」的令牌级执行：想不出更小的字号，就写不出更小的字号。

#### A.2.3 行高

| 令牌 | 值 | 用途 |
|---|---|---|
| `--type-leading-tight` | `1.25` | `--type-size-4` 及以上的标题 |
| `--type-leading-snug` | `1.4` | `--type-size-3`、密集表格单元 |
| `--type-leading-normal` | `1.6` | 正文默认（现有值，保持） |
| `--type-leading-loose` | `1.8` | 参与者长文本（同意说明、社区规则、生命故事） |

**禁止**任何正文行高 < 1.5（Doc 20 §314）。

#### A.2.4 字重

| 令牌 | 值 | 用途 |
|---|---|---|
| `--type-weight-regular` | `400` | 正文 |
| `--type-weight-medium` | `500` | 状态徽章文字、表格表头 |
| `--type-weight-semibold` | `600` | 标题、按钮 |
| `--type-weight-bold` | `700` | 仅确认对话框中被点名的对象（收件人、社区名、版本号） |

**禁止 `font-weight: 300` 及以下**（Doc 20 §314「very light text」）；**禁止段落级 `text-transform: uppercase`**（中文无影响，但英文标识符与术语适用）。

#### A.2.5 字距

| 令牌 | 值 | 用途 |
|---|---|---|
| `--type-tracking-normal` | `0` | 全部中文文本 |
| `--type-tracking-mono` | `0.02em` | 等宽标识符，提升逐字符核对能力 |

#### A.2.6 行宽（measure）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--measure-narrow` | `28rem` | 对话框正文、表单单列 |
| `--measure-default` | `36rem` | 参与者正文（约 34–40 中文字/行） |
| `--measure-wide` | `56rem` | 研究者/员工表格与并列对比 |

`<main>` 的可读区宽度 = `min(100%, var(--measure-default))`；员工工作区提升到 `--measure-wide`。现有 `body { max-width: 44rem }` 由此替换（见 §F）。

---

### A.3 间距令牌与三档密度（A3；Doc 20 §315）

**一套刻度，一个乘数**——Doc 20 §315 要求密集/标准/宽松"不产生互不兼容的独立系统"。做法：刻度固定，`--density` 乘数统一缩放。

| 令牌 | 计算式 | 紧凑 ×0.75 | 标准 ×1 | 宽松 ×1.25 |
|---|---|---:|---:|---:|
| `--space-0` | `0` | 0 | 0 | 0 |
| `--space-1` | `calc(0.25rem * var(--density))` | 3.4px | 4.5px | 5.6px |
| `--space-2` | `calc(0.5rem * var(--density))` | 6.8px | 9px | 11.3px |
| `--space-3` | `calc(0.75rem * var(--density))` | 10.1px | 13.5px | 16.9px |
| `--space-4` | `calc(1rem * var(--density))` | 13.5px | 18px | 22.5px |
| `--space-5` | `calc(1.5rem * var(--density))` | 20.3px | 27px | 33.8px |
| `--space-6` | `calc(2rem * var(--density))` | 27px | 36px | 45px |
| `--space-7` | `calc(3rem * var(--density))` | 40.5px | 54px | 67.5px |
| `--space-8` | `calc(4rem * var(--density))` | 54px | 72px | 90px |
| `--space-9` | `calc(6rem * var(--density))` | 81px | 108px | 135px |

（px 值按 18px 根字号；`--density` 是第 11 个令牌。）

**密度不得缩小以下三类量**（否则会重演 §B.4 的目标重叠缺陷）：

1. `--target-min`（44px）— 恒定
2. `--target-gap`（相邻目标最小净间距）— 恒定
3. `--focus-ring-width` / `--focus-ring-offset` — 恒定

即：**密度只压缩留白，不压缩可点性与可见性。**

**默认值**：参与者工作区 `spacious`（宽松）；研究者/审核/安全/管理工作区 `standard`；仅在员工的数据表格区域局部允许 `compact`，且必须由用户显式选择（§C）。

---

### A.4 形状与描边令牌（A4；Doc 20 §316）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--radius-0` | `0` | 表格单元、贴边区块 |
| `--radius-1` | `0.25rem` | 徽章、输入框、按钮 |
| `--radius-2` | `0.5rem` | 卡片、面板、对话框 |
| `--radius-3` | `0.75rem` | 上下文横幅 |
| `--radius-pill` | `999rem` | **仅** 用于可见性/认识论标签胶囊；不得用于按钮 |
| `--border-hairline` | `1px` | 装饰分隔线（配 `border-subtle`） |
| `--border-default` | `2px` | 输入框、卡片、次级按钮 |
| `--border-strong` | `3px` | 需要注意的容器（warning/stale） |
| `--border-emphasis` | `4px` | 状态容器的**左侧**冗余通道（见 §B.1.3）；`alertdialog` 外框 |

规则：

- 圆角 ≤ `--radius-2`（8px）用于所有交互元素。理由：Doc 20 §316「不得 infantilise」，大圆角+高饱和是消费级游戏化的视觉语汇。
- **描边不得是关键状态的唯一载体**（Doc 20 §316）：关键状态 = 结构（左侧 4px 条）+ 图标 + 文字 + 颜色，四通道齐备。
- 输入框描边一律 `--border-default` + `--color-border-default`（≥3:1），**不得**用 `border-subtle`，也**不得**用"仅下划线"的输入框——低视力下边界不可辨。

---

### A.5 焦点令牌（A5；Doc 20 §317）

| 令牌 | 值 | 说明 |
|---|---|---|
| `--focus-ring-width` | `3px` | 恒定，不随密度/字号缩放 |
| `--focus-ring-offset` | `2px` | 与元素边缘的间隙 |
| `--focus-halo-width` | `2px` | 填满 offset 间隙的同底色环 |

**双环结构**（解决"焦点环压在按钮填充色上导致对比不足"这一类问题）：

```text
[元素填充]  →  halo 2px（= 当前 surface 色）  →  ring 3px（focus-ring）  →  外部 surface
                    ↑ 内侧相邻                      ↑ 外侧相邻
```

- 内侧相邻 = `--color-focus-halo`：light `#FFFFFF` vs ring `#12233F` = **15.70:1**；dark `#05070B` vs ring `#F2F6FF` = **18.63:1**
- 外侧相邻 = 任意 surface：light 最低 **13.51:1**（safety-bg）；dark 最低 **14.19:1**（success-bg）

**均 ≥ 3:1，且不依赖被聚焦元素自身的填充色**——因此 primary 按钮（深蓝填充）上的焦点环同样合规。这是本设计刻意采用双环而非单环的原因。

规则：

- 用 `:focus-visible`，不用 `:focus`（避免鼠标点击后残留焦点环）；但 `<dialog>`/`alertdialog` 打开后的编程式聚焦必须**强制**显示焦点环（`:focus` 也画）。
- **禁止 `outline: none`**，包括临时禁用。评审 grep 项。
- 焦点环必须在所有状态可见：disabled 元素不接收焦点（用 `aria-disabled` + 保留可聚焦性的场景除外，见 §B.1.4）；hover/active/selected/error 状态下焦点环样式不变。
- 焦点环不得被 `overflow: hidden` 裁掉：任何包含交互元素的容器**禁止** `overflow: hidden`，需要裁剪时用 `overflow: clip` + `overflow-clip-margin: var(--focus-ring-total)`。
- 焦点顺序 = DOM 顺序 = 阅读顺序。**禁止正 `tabindex`**；**禁止**用 `order`/`row-reverse`/`grid-area` 改变交互元素的视觉顺序。

---

### A.6 动效令牌与 reduced-motion（A6；Doc 20 §318、§297）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--motion-duration-instant` | `0ms` | reduced-motion 覆盖值 |
| `--motion-duration-fast` | `120ms` | 颜色/描边变化（hover、focus） |
| `--motion-duration-normal` | `200ms` | 展开/收起、对话框进入 |
| `--motion-duration-slow` | `320ms` | 页面级区块进入（谨慎） |
| `--motion-ease-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | 通用 |
| `--motion-ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | 进入（减速） |
| `--motion-ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | 退出（加速） |

规则：

- 动效**不得承载唯一信息**：任何靠动画表达的状态必须同时有静态文字。
- **禁止**：庆祝动效、confetti、奖励动画、连续记录动画——用于 Consent、匹配、消息量、研究完成的一律禁止（Doc 20 §297 明文）。
- **禁止**假进度：不知道进度就用不确定态（文字「正在处理」），不画会走到 90% 卡住的进度条（Doc 20 §224）。
- **禁止**自动播放、自动轮播、无限循环动画。
- AI 流式输出期间**不得移动焦点**（Doc 20 §294）；流式文本容器用 `aria-live="off"`，完成后一次性用 `role="status"` 播报「草稿已生成，请检查」。
- `prefers-reduced-motion: reduce` 时：现有全局 `animation:none/transition:none` 保留，**并且**把 `--motion-duration-*` 全部覆盖为 `0ms`，使 `calc()` 派生值也归零。替代表达：用即时状态切换 + 文字变化，不用淡入淡出。

---

### A.7 层级 / elevation 与 z-index（A7；Doc 20 §319）

| 令牌 | 值 | 允许用于 |
|---|---|---|
| `--elevation-0` | `none` | 页面内容、卡片（默认） |
| `--elevation-1` | `0 1px 2px rgb(11 18 32 / 0.10), 0 0 0 1px rgb(11 18 32 / 0.06)` | 菜单、下拉 |
| `--elevation-2` | `0 4px 12px rgb(11 18 32 / 0.14), 0 0 0 1px rgb(11 18 32 / 0.08)` | 对话框、粘性动作条 |
| `--elevation-3` | `0 10px 28px rgb(11 18 32 / 0.20), 0 0 0 1px rgb(11 18 32 / 0.10)` | 临时浮层（仅一处，见下） |

| 令牌 | 值 | 层 |
|---|---:|---|
| `--layer-base` | `0` | 常规内容 |
| `--layer-sticky` | `10` | 粘性动作条、粘性表头 |
| `--layer-header` | `20` | 上下文横幅 / 工作区横幅 |
| `--layer-scrim` | `30` | 对话框遮罩 |
| `--layer-dialog` | `40` | `alertdialog` |
| `--layer-live` | `50` | 会话超时警告（必须盖过一切） |

规则（Doc 20 §319）：

- **elevation 不得表示科学置信度、证据强度、审批权威或紧急程度**。安全关键错误不因为"重要"就抬高阴影——它靠位置、持久性与文字表达（§E.10）。
- dark 主题下阴影几乎不可见，因此每个 elevation 都自带 `0 0 0 1px` 描边环；dark 主题把该环替换为 `--color-border-default`，保证浮层边界 ≥3:1（§F 中已写入）。
- 同一屏最多一层浮层。**禁止**对话框上再开对话框（这也直接服务「一次一个有意义的决定」）。

---

### A.8 触控目标令牌（A8 前置；Doc 20 §295）

| 令牌 | 值 | 说明 |
|---|---|---|
| `--target-min` | `2.75rem`（44px @18px 根） | 最小可点尺寸，**宽高皆适用** |
| `--target-gap` | `0.5rem`（9px） | 相邻目标之间的**净空隙**下限 |
| `--target-hit-slop` | `0.25rem` | 视觉尺寸小于 44px 时，用 `::before` 扩大命中区所需的外扩量 |

完整规则见 §B.4。

---

### A.9 图标体系（A8；Doc 20 §320）

**不引入图标库**（依赖约束 + 体积 + 离线）。做法：`apps/web/src/components/icons.tsx` 内联 SVG，`viewBox="0 0 24 24"`、`stroke="currentColor"`、`stroke-width="2"`、`fill="none"`、`aria-hidden="true"`、`focusable="false"`。

| 令牌 | 值 | 说明 |
|---|---|---|
| `--icon-size-1` | `1em` | 与行内文字同高（徽章内） |
| `--icon-size-2` | `1.25em` | 块级状态容器 |
| `--icon-size-3` | `1.5em` | 对话框标题旁 |
| `--icon-stroke` | `2` | 恒定；高对比模式提升到 `2.5` |
| `--icon-gap` | `var(--space-2)` | 图标与文字间距 |

**必须有文字标签、不得单独出现的图标**（Doc 20 §320 明列）：AI、屏蔽（Block）、举报（Report）、可见性（Visibility）、安全（Safety）、草稿（Draft）。本系统把这条收紧为：**所有图标一律不得单独出现**——不存在纯图标按钮。理由：中文界面里图标语义歧义更大，且纯图标按钮的可访问名依赖 `aria-label`，与"文字即可访问名"的现有测试策略冲突（§G）。

**形状必须互异**（灰度/色盲下的区分通道）：

| 语义 | 轮廓形状 | 描述 |
|---|---|---|
| info | 圆 ○ | 圆圈内 i |
| success | 圆 + 对勾 ✓ | 圆圈内勾 |
| warning | 三角 △ | 三角内感叹号 |
| danger | 八角 ⯃ | 八边形内感叹号（与 warning 三角明确不同） |
| safety | 盾形 ⛊ | 盾牌轮廓 |
| moderation | 方 ▢ | 方框内旗帜 |
| ai | 菱形 ◇ | 菱形内星点（低调，不发光、不彩虹） |
| draft | 折角纸 | 右上折角矩形 |
| private / 可见性 | 闭锁 / 开放地球 | 两端极值形状差异最大 |
| offline | 断开的云 | 云 + 斜杠 |
| stale / conflict | 双圆错位 | 两个错位圆 |
| loading | 圆弧 | reduced-motion 下不旋转，改为静态圆弧 + 文字 |

验收：把 12 个图标渲染为灰度 PNG，无文字，请 3 人盲测能否两两区分；不能区分的重画。**这是设计验收项，不是自动化项。**

---

## §B 全局规则

### B.1 颜色不得是唯一状态指示 —— 状态呈现三元组

#### B.1.1 规范

任一状态呈现 = **图标 + 文字 + 颜色**，三者齐备且各自独立可用。

```html
<!-- 行内徽章（可见性、认识论类型、投递状态、审批状态） -->
<span class="badge badge--warning">
  <svg class="icon" aria-hidden="true" focusable="false"><!-- 三角 --></svg>
  草稿 — 只有你能看到
</span>
```

| 通道 | 要求 | 失效时的后备 |
|---|---|---|
| **图标** | `aria-hidden="true"`，装饰性，形状互异（§A.9） | 图标不渲染时文字仍完整表达状态 |
| **文字** | 状态名是**真实文本节点**，构成可访问名的一部分，**不得**只存在于 `aria-label`/`title`/`::before content` | — |
| **颜色** | 仅强化。**移除全部颜色后，信息零损失** | — |
| （第四通道）**结构** | 关键状态额外加左侧 `--border-emphasis` 条或独立容器 | 见 §B.1.3 |

#### B.1.2 三条禁令

1. **禁止 `content:` 承载状态文字**——`::before { content: "已批准" }` 在部分 AT 下不播报，且用户样式表下丢失。
2. **禁止仅靠 `background-color` 区分行状态**（表格行、队列行）。行状态必须有一列文字。
3. **禁止仅靠图标区分**——见 §A.9，无纯图标状态。

#### B.1.3 关键状态的四通道

「关键状态」= 会改变用户对后果判断的状态。清单（Doc 20 §43–45、§50）：

- 生命周期：Draft / Active / Paused / Completed / Withdrawn / Superseded / Retired / Archived
- 审批：Not Submitted / In Review / Returned for Revision / Approved / **Approved with Conditions** / Rejected / Superseded / Archived
- 资源：Usable / Restricted / Suspended / Expired / Deleted / Withdrawn / **Locked** / Unavailable
- 投递：现有 `DELIVERY_STATE_LABELS` 七态（保持文案不变，见 §G）
- 同步：本地已保存 / 正在同步 / 已同步 / 冲突 / 同步失败 / 需要复核
- 可见性：六级（§A.1.4）
- 认识论类型：Doc 19 §10 十一类（平台事实 / 参与者提供信息 / 参与者证言 / 支持者贡献 / 人工观察 / 人工决定 / 检索到的证据 / AI 推断 / 建议 / 草稿 / 未知）

这些**必须**用块级状态容器（左 4px 条 + tint 底 + 图标 + 文字），不得只用行内徽章。

#### B.1.4 禁用态的表达

禁用不是状态三元组的例外，而是它的一个实例：

- **禁止**只把按钮变灰。灰色按钮旁必须有一句说明**为什么**以及**怎样才能启用**。
- 优先用 `aria-disabled="true"` + 保留可聚焦性 + 点击时用 `role="status"` 播报原因，而不是 `disabled` 属性（`disabled` 元素不可聚焦，键盘用户无法发现它为什么不可用）。
- 例外：表单提交中（防重复提交）用真 `disabled`，并同步显示「正在提交…」。
- **权限不足不用禁用态表达**——见 §E.9 受保护存在。

#### B.1.5 验收

1. **灰度检查**：`filter: grayscale(1)` 下截图，所有状态仍可区分（人工，纳入 R1 专家走查）。
2. **裸 HTML 检查**：禁用全部 CSS，所有状态文字仍在文档流中可读（可自动化：`document.body.innerText` 包含状态名）。
3. **`content` grep**：`grep -n "content: *['\"][^'\"]" styles.css` 的命中不得包含中文或状态词。

---

### B.2 焦点在所有状态可见

见 §A.5 令牌与双环结构。此处补交互规则（Doc 20 §294）：

| 时机 | 焦点去向 |
|---|---|
| 屏幕切换（`setScreen`） | `<main>` 内的 `<h1>`（`tabindex="-1"`，聚焦后不留 tabstop） |
| 对话框打开 | 对话框标题（`<h2 tabindex="-1">`），**不是**主按钮——避免误触；`aria-labelledby` 指向该标题 |
| 对话框关闭 | 触发它的按钮（必须保存引用） |
| 校验失败 | 第一个出错字段；同时 `role="alert"` 播报错误摘要 |
| 动作成功 | 停在原地，用 `role="status"` 播报；**不跳转焦点**（避免"我的位置没了"） |
| 动作失败 | 停在原地，`role="alert"` 播报；焦点不动，用户可直接改后重试 |
| 动态内容插入（列表加载） | 焦点不动，`role="status"` 播报数量 |
| AI 流式输出 | **焦点绝不移动**（Doc 20 §294 明文） |

规则：焦点环不得被粘性元素遮挡——粘性头/尾必须为其后的内容预留 `scroll-padding-block`（§D.5）。

---

### B.3 200% 缩放与高文本缩放：不横向滚动

#### B.3.1 结构规则

1. **一切尺寸用 `rem` / `%` / `ch` / `em`**，禁止布局用 `px`（`px` 只允许出现在描边宽度、焦点环宽度、阴影这些"物理细节"上）。
2. **断点用 `rem`**（§D.1）：浏览器字号调大 → 有效视口变窄 → 自动降级为单列。这是特性不是缺陷（取舍 §H.3）。
3. **禁止固定 `height`**；只用 `min-height`。
4. **禁止 `white-space: nowrap`** 于任何用户可见文本；仅允许用于等宽标识符，且必须配 `overflow-wrap: anywhere` 的兄弟策略或放入 §B.3.2 的滚动容器。
5. **`overflow-wrap: anywhere`** 全局生效于正文容器——长标识符（`pt_b`、UUID、哈希）不撑破布局。
6. 顶层守卫：`html, body { overflow-x: clip; }` 不用来掩盖问题，而是作为最后一道防线；**任何触发它的布局都是缺陷**。

#### B.3.2 宽内容的唯一合法出口

表格、代码块、ASCII 线框、宽图表**不得**让页面横向滚动，只能在自己的容器里滚动：

```html
<div class="scroll-x" role="region" aria-label="参与者列表（可横向滚动）" tabindex="0">
  <table>…</table>
</div>
```

- 必须 `tabindex="0"`（键盘可滚）+ `role="region"` + `aria-label`（说明它可滚动）。
- 容器两侧用 `--color-border-default` 描边，让"这里还有内容"可见。
- 移动端优先给**替代表示**（卡片列表）而非滚动；但见 §D.4 关于何时不能替代。

#### B.3.3 验收

- 视口 1280×1024 @ 200% 缩放（等效 640×512 CSS px）与 320×256 CSS px：`document.documentElement.scrollWidth <= clientWidth`。
- 浏览器最小字号设为 24px：同上断言 + 所有 44px 目标仍不重叠（§B.4）。
- 400% 缩放（WCAG 1.4.10 的正式门槛，等效 320px 宽）：单列，无内容丢失。

---

### B.4 触控目标 ≥44px 且相邻目标不得重叠 —— 防复发规则

> **背景（真实缺陷）**：`min-height: 2.75rem` 的按钮出现在由 `line-height: 1.6 × 18px = 28.8px` 决定的行框里。行内级按钮之间靠 JSX 的 `{' '}` 文本节点提供间隔，换行后行框按行高堆叠，44px 高的按钮相互压叠。现有 `styles.css` 已针对**首页列表**做了局部修补（`main li > button { display: block }`），但这是点修，不是规则——换一个容器就会复发。

#### B.4.1 五条不可复发规则

**R1｜尺寸唯一来源**
`--target-min` 是最小目标尺寸的唯一定义。组件 CSS **禁止**写字面高度。评审 grep：`min-height:\s*[0-9.]+(rem|px)` 在 `:root` 之外零命中。

**R2｜交互元素不得作为行内级参与文本行框**
所有 `button`、`a[role="button"]`、`input`、`select`、`summary`、以及任何有 `onClick` 的元素，其 `display` 必须是 `block` / `flex` / `grid` / `inline-flex` 之一，**禁止 `display: inline`**，且必须 `align-items: center`。行内级元素的高度不参与行框计算（或参与得不可控），这是缺陷根因。

**R3｜间距必须由布局提供，禁止由空白文本节点提供**
相邻目标之间的间隔一律由父容器的 `display: flex; gap: var(--target-gap)` 或子元素的 `margin-block` 提供。
**禁止**用 JSX 的 `{' '}`、`&nbsp;`、`<br>` 作为按钮之间的间隔——它们是文本，会随行高塌陷、随字号变化失控。
> 现有代码 `App.tsx:60–66`（`进入 / 支持者入口 / 员工入口`）与 `MessagePanel` 等处正是 `{' '}` 分隔。改为 flex 容器 **不改变任何按钮的可访问名**（§G.2）。

**R4｜内容流中的动作是整行块级目标**
`<li>`、`<p>`、`<td>` 内的动作按钮：若该容器内只有这一个动作，按钮占满整行（`display: block; width: 100%; text-align: start`）；若有多个动作，父容器改为 `display: flex; flex-wrap: wrap; gap: var(--target-gap)`，且每个按钮 `flex: 1 1 auto; min-width: 12rem`（保证换行后每行仍是完整可点块）。

**R5｜容器不得压缩目标**
包含交互元素的容器**禁止**：固定 `height`、`overflow: hidden`、`line-height` 小于 `--target-min` 的同时限制溢出、`max-height` + 裁剪。需要裁剪时用 `overflow: clip; overflow-clip-margin: var(--focus-ring-total)`。

#### B.4.2 例外与命中区扩展

只有两类元素允许**视觉**小于 44px：

1. 正文中的行内链接（WCAG 2.5.8 的 inline exception）
2. 密集表格中的行内动作——**且必须**用 `::before` 把命中区扩到 44px：

```css
.target-inline { position: relative; }
.target-inline::before {
  content: '';
  position: absolute;
  inset: calc(-1 * var(--target-hit-slop));
  min-height: var(--target-min);
  min-width: var(--target-min);
  /* 垂直居中扩展 */
  top: 50%; translate: 0 -50%;
}
```

**但**：命中区扩展后相邻目标的**命中矩形**同样不得相交——扩展不豁免 R3 的间距要求。

#### B.4.3 自动化回归断言（建议纳入 CI）

这是防复发的关键，不是可选项：

```ts
// 伪代码：jsdom 无布局，需 Playwright / 真实浏览器
const targets = page.locator('button, a[href], input, select, [role="button"], summary');
const rects = await targets.evaluateAll(els => els.map(e => e.getBoundingClientRect()));

// 1) 尺寸
for (const r of rects) {
  expect(r.height).toBeGreaterThanOrEqual(44);
  expect(r.width).toBeGreaterThanOrEqual(44);
}
// 2) 互不相交（含 --target-gap 的净空隙）
const GAP = 8;
for (let i = 0; i < rects.length; i++)
  for (let j = i + 1; j < rects.length; j++) {
    const a = rects[i], b = rects[j];
    const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    expect(overlapX > -GAP && overlapY > -GAP).toBe(false); // 需有一轴净距 ≥ GAP
  }
```

**运行矩阵**：320px / 375px / 768px / 1280px 宽 × 字号 {默认, 24px, 32px} × 密度 {compact, standard, spacious} × 缩放 {100%, 200%, 400%}。至少覆盖 320px×32px×spacious×200% 这一最恶劣组合。

#### B.4.4 关键控件的额外保护（Doc 20 §295）

`屏蔽`、`报告`、`取消`、`返回`、`撤回` 必须"可达且不易误触"：

- 与**破坏性/确认类**按钮之间的净空隙提升至 `--space-5`（标准密度 27px），而非 `--target-gap`。
- 确认对话框中，`确认…` 与 `返回，不…` 分列两行（移动端）或用 `--space-5` 分隔（宽屏），**且顺序恒为「返回/取消」在前、「确认」在后**（防止肌肉记忆误触）。
  > 注：现有实现（如 `确认屏蔽` / `返回，不屏蔽`）的**按钮文案与可访问名保持不变**，只调整布局与顺序 —— 顺序调整会影响按 DOM 顺序的测试，见 §G.3。

#### B.4.5 等权重选择对：`.btn-primary` 的禁用场景（Doc 20 §13.7 无暗黑模式）

当两个选项在**价值上等权**时，**两者都不得**使用 `.btn-primary`，必须同尺寸、同字重、同描边、同色，只有文字不同：

| 场景 | 按钮对 | 要求 |
|---|---|---|
| 同意选择 | `同意「…」` / `拒绝「…」` | 两者视觉完全相同。`consent-panel.test.tsx:34–37` 已断言两组按钮数量相等——**这条测试是这条规则的现有守卫，必须保持通过** |
| 匹配决定 | `感兴趣` / `暂时不` | 同上 |
| 参与可选活动 | `参加` / `这次不参加` | 同上 |
| 撤回确认 | `确认撤回「…」` / `返回，不撤回` | 同上（撤回是用户的权利，不得让"返回"显得更可取） |

`.btn-primary` 只允许用于**没有对立选项**的单一前进动作（`保存草稿`、`提交报告`、`进入`）。
**验收**：对每一组等权按钮断言 `getComputedStyle` 的 `backgroundColor`、`fontWeight`、`borderWidth` 完全相同。

---

### B.5 语义 HTML 与"不得为视觉引入 div 汤"

| 需求 | 正确做法 | 禁止 |
|---|---|---|
| 卡片 | `<article>` / `<section aria-labelledby>` | `<div class="card">` |
| 状态徽章 | `<span class="badge">` 内含真实文本 | `<div>` + `::before content` |
| 队列/列表 | `<ul>` / `<ol>` + `<li>` | `<div role="list">` |
| 表格 | `<table><thead><th scope="col">` | `<div role="grid">` |
| 折叠 | `<details><summary>` | `<div onClick>` |
| 对话框 | `<div role="alertdialog" aria-labelledby aria-modal="true">`（现状）或 `<dialog>` | 无语义浮层 |
| 分组 | `<fieldset><legend>` | `<div>` + 视觉标题 |
| 布局 | 在**已有**语义元素上加 class 做 flex/grid 容器 | 新增纯布局 `<div>` 包裹层 |

**唯一允许新增的非语义包裹**：`.scroll-x`（§B.3.2，带 `role="region"`）与 `.app-shell`（最外层 flex 容器，现已存在于 `App.tsx` 的 `<div>`）。

---

## §C 能力自适应模式（C；Doc 20 §286–287）

### C.1 四个可切换维度

全部以 `<html>` 上的 `data-*` 属性驱动令牌覆盖。**没有任何 JS 逻辑判断"用户是谁"。**

| 维度 | 属性 | 取值 | 令牌覆盖 |
|---|---|---|---|
| 字号 | `data-font-scale` | `md`(默认) / `lg` / `xl` / `xxl` | `--scale-font` = 1 / 1.125 / 1.25 / 1.5，作用于 `:root { font-size: calc(112.5% * var(--scale-font)) }` |
| 密度 | `data-density` | `compact` / `standard` / `spacious`(参与者默认) | `--density` = 0.75 / 1 / 1.25（§A.3） |
| 对比 | `data-contrast` | `standard`(默认) / `high` | 覆盖 §A.1 的颜色令牌为高对比组；`--border-default` → 3px；`--icon-stroke` → 2.5 |
| 简化 | `data-simplify` | `off`(默认) / `on` | `--simplify: 1`；配合组件级 `[data-simplify="on"] .optional { display: none }` 与"每屏一个主要动作" |

### C.2 与 Doc 20 §286 八种模式的映射（诚实对照）

| Doc 20 模式 | 本系统实现 | 说明 |
|---|---|---|
| Standard | 全部默认值 | ✅ 令牌覆盖 |
| High Visibility | `data-contrast="high"` + `data-font-scale="xl"` | ✅ 令牌覆盖 |
| Simple | `data-simplify="on"` | ✅ 令牌 + 组件可见性 |
| Low Stimulation | `data-simplify="on"` + 强制 reduced-motion + 关闭全部 tint 底色（只留描边与文字） | ✅ 令牌覆盖 |
| Step-by-Step | ❌ **不是令牌能实现的** | 需要流程层拆分（多步表单、每步一个决定）。属 I16 表单族，本文件不覆盖 |
| Read-Aloud | ❌ **不是令牌能实现的** | 需要 TTS 能力与 §300 多模态同意；见 §I.4 未决 |
| Supporter-Assisted | ❌ **不是令牌能实现的** | 需要权限模型与"谁在代为操作"的呈现；见 D2/§180–181 |
| Extended Time | ❌ **不是令牌能实现的** | 属会话超时策略（I14 / §296、§238） |

**这张表是诚实声明**：本设计系统只交付 4 个维度中可由令牌实现的部分，另 4 种模式必须在流程层单独设计，不得声称"已支持八种模式"。

### C.3 绝对禁令

1. **不得按年龄自动判定**。系统不得读取、推断或使用出生日期/年龄段来预设任何模式。
2. **不得按参与者分组自动判定**（如"干预组默认宽松"）——那会成为混杂变量，且是把人当类别对待。
3. **不得由 AI 推断能力**并自动切换。
4. **不得因某人使用了辅助技术就替他改变设置**——尊重 OS 信号只作**初始值**，不作锁定。

允许作为**初始值**的信号（都是用户自己在系统里设过的偏好，不是对人的推断）：

| 信号 | 映射 |
|---|---|
| `prefers-color-scheme` | light / dark |
| `prefers-contrast: more` | `data-contrast="high"` 初始值 |
| `prefers-reduced-motion: reduce` | 动效令牌归零 |
| 浏览器根字号 | 天然生效（rem） |

用户一旦显式设置，用户值**永久优先**于 OS 信号。

### C.4 控制界面要求（Doc 20 §287）

| 要求 | 实现 |
|---|---|
| 易于找到 | 在**每个**工作区的主导航中有固定项「显示与阅读设置」；不埋在二级菜单 |
| 可预览 | 设置页顶部有**实时样例区**（一段正文 + 一个按钮 + 一个状态徽章），随选择即时变化 |
| 可逆 | 每个维度旁有「恢复默认」，页面底部有「全部恢复默认」 |
| 持久 | `localStorage`（共享设备模式下改为 `sessionStorage`，见 §D.6） |
| 任务中可用 | 设置以 `<dialog>` 形式从任何屏幕打开，**不卸载当前屏幕、不丢失表单输入**；关闭后焦点回到触发按钮 |

**实现约束**：属性写在 `<html>` 上、令牌覆盖是纯 CSS，因此切换不触发 React 重渲染，表单状态天然保留。这是选择 `data-*` 而非 React Context 的理由。

**无 JS 降级**：`<noscript>` 下无法切换，但 `prefers-*` 媒体查询仍生效——因此高对比与暗色主题**必须**同时写成媒体查询与属性选择器两套（§F 已如此实现）。

---

## §D 响应式（A9；Doc 20 §301–307）

### D.1 断点（内容驱动，rem 单位）

| 名称 | 条件 | 由什么内容决定 |
|---|---|---|
| （基准） | `< 40rem` | 单列。参与者默认形态。所有设计从这里开始 |
| `sm` | `≥ 40rem`（720px @18px） | 一行能放下两个 `min-width: 12rem` 的动作按钮 |
| `md` | `≥ 56rem`（1008px） | 员工工作区可以出现侧边导航 + 内容两列 |
| `lg` | `≥ 76rem`（1368px） | 员工工作区可以出现三列或"列表 + 详情 + 上下文"并列 |

**用 `rem` 而非 `px`**：用户把字号调到 32px 时，40rem = 1280px，多数平板会落回单列——大字用户自动得到单列。这是有意为之（取舍 §H.3）。

### D.2 移动优先的布局规则

1. **基准样式 = 移动样式**。所有 `@media` 只用 `min-width`，不用 `max-width`。
2. **参与者工作区在任何宽度下都是单列**，正文宽度封顶 `--measure-default`。宽屏只增加左右留白，不增加列数。理由：Doc 20 §13.2「一次一个有意义的决定」——多列天然并列多个决定。
3. **员工工作区**可在 `md`/`lg` 分列，但：任一列内部仍是单列流；不得把一个决定的上下文与它的确认按钮分到两列（Doc 20 §13.3「先解释再询问」要求同屏可见，分列视为违规，除非两列在同一视口内同时完整可见）。

### D.3 导航

| 断点 | 参与者 | 员工 |
|---|---|---|
| 基准 | 顶部单行横向滚动的 `<nav>`（现状）**或**底部固定栏；见 §I.2 未决 | 顶部 `<nav>`，可换行 |
| `sm+` | 顶部 `<nav>`，`flex-wrap: wrap`，每项 ≥44px | 同上 |
| `md+` | 同上（不变，保持单列） | 左侧持久侧栏（`<nav>` + `<ul>`），内容区 `--measure-wide` |

规则：

- 导航项数 ≤ 7（现有参与者导航为 6 项，合规）。
- `aria-current="page"` 已在现有实现，保留；视觉上用**左/下 4px 实心条 + 加粗 + 颜色**三通道，不只用颜色。
- **移动端底部导航若采用**：必须为内容区加 `padding-block-end: calc(导航高度 + var(--space-5))`，且不得遮挡任何 `确认/取消` 按钮（Doc 20 §304「sticky but non-obscuring」）。

### D.4 表格 → 卡片的降级（以及何时不降级）

| 情况 | 移动端做法 |
|---|---|
| 纯展示、每行 ≤4 个字段（如报告队列） | 降级为 `<ul>` + `<li>` 卡片，每字段 `<dl><dt>字段名<dd>值` |
| 需要跨行比较的数据（数据集质量复核、版本对比） | **不降级**。保留 `<table>`，放进 §B.3.2 的 `.scroll-x` 容器 |
| 带行内动作的队列 | 降级为卡片，动作按 R4 变为整行块级按钮 |

**注意**：`<table>` → `<ul>` 的降级**改变了元素角色**。若某个测试用 `getByRole('table')` 或 `getByRole('row')` 查询，降级会在窄视口下失败。现有 34 个测试中**没有**表格角色查询（已核对，见 §G.1），但未来新增表格时必须遵守：**响应式降级不得跨断点改变角色**——正确做法是两种表示同时存在于 DOM、用 CSS 显隐，或统一只用一种。本系统选择：**队列一律用 `<ul>` 语义，宽屏用 CSS Grid 排成表格外观**，从而角色恒定。真正需要 `<table>` 语义的（多维数据）则永不降级、只滚动。

### D.5 粘性元素

- 粘性只用于：员工表格表头、长表单的动作条、会话超时警告。
- 粘性元素必须：`position: sticky`（非 `fixed`）、`z-index: var(--layer-sticky)`、总高度 ≤ 视口 25%。
- 视口高度 < `30rem`（横屏手机、分屏）时取消粘性：`@media (max-height: 30rem) { .sticky { position: static } }`。
- 页面必须设 `scroll-padding-block-start: <粘性头高度>` 与 `scroll-padding-block-end: <粘性尾高度>`，否则键盘 Tab 到的元素会被粘性条盖住（焦点可见性硬要求，§B.2）。

### D.6 共享环境与共享设备（Doc 20 §306–307）

这不是"响应式的附属"，而是本平台的真实场景（社区中心的共用平板）。

| 要求 | 设计 |
|---|---|
| 谨慎的页面标题 | `<title>` 恒为「健康老龄化研究平台」，**不含**参与者姓名、社区名、消息内容。切屏不改 title（改用 `<h1>` 承载屏幕名） |
| 通知不含内容 | 任何浏览器通知/角标只说「有 1 条新消息」，不带发件人与正文 |
| 隐私屏 | 导航中固定项「遮住屏幕」→ 立即覆盖内容为不透明遮罩 + 「已遮住。点击继续」。**遮罩必须是不透明色块，不得用 `filter: blur()`**（模糊可被截图增强还原，且低视力用户误以为是渲染故障） |
| 易于登出 | 「退出登录」在导航中恒定可见，≤2 次点击（含一次确认），不埋在菜单 |
| 减少最近内容预览 | 共享设备模式下，列表页只显示对方标识与时间，不显示消息摘要 |
| 安全返回首页 | 每屏有「回到首页」，且首页不含任何内容预览 |
| 显式用户切换 | 「切换使用者」= 完全清空 `sessionStorage` + 重新进入登录 |
| 短超时 | 共享设备模式空闲 5 分钟警告、7 分钟登出（普通模式 20/25 分钟）；见 §E.11 |
| 当前身份可见 | 上下文横幅恒显示「当前：{标识}」，用 `--color-surface-inverse` 反色条，不可关闭 |
| 本地草稿保护 | 共享设备模式下草稿只存服务端；`localStorage` 不写任何内容，偏好设置改存 `sessionStorage` |

共享设备模式的**开关**：登录页上的显式复选框「这是共用的设备」，默认**未勾选**但文案醒目。不得自动探测（探测会误判且不可解释）。

**状态：已实现（2026-08-05）**。开关按本节要求做成登录页的显式复选框，且**不探测**。已落地：恒显的上下文横幅（当前身份）、隐私屏（不透明色块，并把身后一切设为 `inert`——没有这一步，从遮罩后面按 Tab 会走遍页面上每一个控件，屏幕阅读器把遮罩要挡的东西一字不落读出来）、「切换使用者」、偏好改存 `sessionStorage`、5/7 分钟短超时（§E.11）、`<title>` 改为不含角色的固定标题。

三处按事实偏离本节：

- **「切换使用者 = 完全清空 `sessionStorage`」不照字面做**：共享设备标记正存在那里，照字面做会让最保护人的设置在陌生人坐下的那一刻消失。清空后把标记写回，关于人的一切不写回（D-18）。
- **环境访问口令仍留在 `localStorage`**：它是原型环境的门钥匙而不是关于人的信息；清掉它会让整台公用平板从此进不来（D-18）。
- **「减少最近内容预览」无需实现**：会话列表本来就不显示消息摘要，只有对方标识、可以互相写信的依据与会话状态。浏览器通知同理——平台没有通知，没有内容可省。

**量出来的一处修正**：横幅第一版（一句整话＋两个块级按钮）在 320×844 下占 304px，即视口的 36%，超过 §D.5 给粘性元素的 25% 上限。改成两个并排按钮后为 169–197px（20–23%）；`xl`/`xxl` 两档字号下仍达 45%，故在这两档**取消粘性**——选择放大字号的人正是屏幕空间最紧的人，把接近一半的视口钉死给一条常驻横幅，方向就是反的。

---

## §E 状态呈现规范（I11 / I12 / I13）

### E.0 通用结构与文案宪法

所有状态呈现共用一个结构（图标 + 标题 + 说明 + 动作 + 可选技术细节）：

```html
<div class="state state--{severity}" role="{status|alert|none}">
  <p class="state__head">
    <svg class="icon" aria-hidden="true" focusable="false">…</svg>
    <strong>{状态标题}</strong>
  </p>
  <p class="state__body">{发生了什么 / 你的内容怎么样了 / 什么没有发生}</p>
  <p class="state__actions"><button>{下一步动作}</button></p>
  <details class="state__detail"><summary>技术细节</summary><p><code>{code}</code></p></details>
</div>
```

**文案宪法（六条，全部可检验）**：

1. **说明下一步能做什么**。每条错误/空/离线文案的最后一句必须是一个用户可执行的动作或一条求助路径。
2. **不指责用户**。禁用第二人称过失句式。
   | 禁止 | 改为 |
   |---|---|
   | 你输入的内容有误 | 这一项需要填写{要求}。 |
   | 你没有权限 | 这一项在你当前的角色下看不到。 |
   | 你的网络有问题 | 现在连不上服务器。 |
   | 操作失败，请重试 | 没有保存成功。你写的内容还在，可以再点一次「保存草稿」。 |
   | 无效的请求 | 这次提交没有被接受，因为{具体原因}。 |
3. **说明工作是否保存**。每条错误必须明确回答"我刚才写的东西还在吗"。
4. **说明什么没有发生**（Doc 20 §231）。例：「消息**没有**发出。」「同意**没有**被更改。」
5. **不给虚假安慰**。未知就是未知：「送达状态未知 — 正在核实，不代表成功」（现有 `DELIVERY_STATE_LABELS` 已合规，保持）。禁止「马上就好」「应该没问题」。
6. **技术码只作可选细节**：错误码放 `<details>`，摘要文字为「技术细节」。主文案里不出现 `ERR_*`。
   > 现有代码把错误码直接拼进主文案（`未能获取消息记录：${err.error.code}`）。这是本规范要求改动的一处，影响见 §G.4。

**播报规则**：

| 严重度 | ARIA | 是否打断 |
|---|---|---|
| 加载/同步/空 | `role="status"`（`aria-live="polite"`） | 否 |
| 信息性 | `role="status"` | 否 |
| 可恢复错误 | `role="alert"` | 是（AT 打断） |
| 阻断错误 | `role="alert"` + 焦点移到容器 | 是 |
| 安全关键 | `role="alertdialog"` + `aria-modal` | 是，接管 |
| 安全性关键 | `role="alertdialog"` + 会话处理 | 是，接管 |

---

### E.1 加载（Doc 20 §224）

| 项 | 规范 |
|---|---|
| 结构 | `role="status"` + 图标（静态圆弧，reduced-motion 下不转）+ 文字 |
| 布局 | **保留布局**：容器保持最终高度（`min-height`），不得让内容跳动 |
| 进度 | **禁止假进度条**。不知道就用不确定态文字 |
| 取消 | 只在取消安全时提供（只读查询可取消；已提交的写操作不可取消，改为「正在确认，请勿重复提交」） |
| 超时 | ≥10s 显示恢复路径 |
| 高影响动作 | 必须等服务端确认，**不得**乐观更新（Doc 20 §224 末句） |

**文案**

- 载入中：`正在载入{对象}…`
- 提交中：`正在提交…请稍候，不要重复点击。`
- ≥10s：`还在处理。你可以继续等待，或者回到上一步再试一次。你写的内容不会丢。`
- 高影响动作等待服务端：`正在等待服务器确认。在确认之前，{对象}还没有{动作}。`
  - 例：`正在等待服务器确认。在确认之前，这条消息还没有发出。`

### E.2 骨架（Doc 20 §225）

| 项 | 规范 |
|---|---|
| 适用 | 可预测的低风险列表：会话列表、社区帖子列表、贡献列表 |
| **禁止** | 审批状态、消息投递状态、安全决定、匹配结果、数据集锁定 —— 这些**绝不**用骨架，因为骨架的形状会被读成"结果已存在" |
| 无障碍 | 骨架块 `aria-hidden="true"`；外层容器 `role="status"` 内含真实文字「正在载入会话列表」 |
| 动效 | 微光扫过仅在 `--motion-duration-normal` 下允许；`reduced-motion` 时静态灰块 |
| 形状 | 只画中性灰条（`--color-surface-sunken`），**不得**画出徽章形状、按钮形状或对勾 |

### E.3 空状态（Doc 20 §226）

必须回答四问，顺序固定：

```text
[图标]  {为什么是空的}
        {这是正常的吗}
        {你可以做什么}   ← 一个明确动作
        {去哪里求助}     ← 链接或说明
```

| 场景 | 文案 |
|---|---|
| 无消息 | **还没有消息。**<br>你还没有和任何人开始会话，这很正常。<br>[去看看可以联系的人]<br>不确定怎么开始？在「帮助与安全」里可以联系研究团队。 |
| 无联系人 | **你还没有建立联系。**<br>建立联系需要双方都表示愿意，这需要一点时间。<br>[看看「认识新朋友」]（可选，你随时可以不参加）<br>—— |
| 无匹配候选 | **现在没有可以推荐的人。**<br>这不代表出了问题：推荐依据你的兴趣与设置，有时候就是没有合适的。<br>[看看我的兴趣设置]<br>—— |
| 无社区帖子 | **「{社区名}」里还没有帖子。**<br>这个社区刚开始，还没有人发布内容。<br>[写第一篇（会先存成草稿，只有你能看到）]<br>—— |
| 无生命故事 | **你还没有添加生命故事。**<br>这是完全自愿的，不添加也不影响你参与研究。<br>[了解生命故事是什么]<br>—— |
| 无待办（首页） | **今天没有需要你做的事。**<br>这是正常的，研究不会每天都有任务。<br>[看看我的同意选择]<br>—— |
| 队列为空（员工） | **当前没有待处理的{对象}。**<br>队列为空。<br>[查看已处理的记录]<br>—— |

**禁令**：空状态不得写「快去认识新朋友吧！」这类促动语；不得用插画暗示"你很孤单"；可选功能的空状态必须明写「可选」「不参加也没关系」。

### E.4 离线（Doc 20 §227）

```text
[断云图标] 现在是离线状态
           已经载入的内容还能看，新的内容看不到。
           你现在**不能**：发送消息、确认同意的更改、提交报告。
           你写的草稿保存在这台设备上，连上网络后会同步。
           [重新检查连接]
```

| 项 | 规范 |
|---|---|
| 位置 | 页面顶部持久横幅（`--layer-header`），不可关闭，直到恢复 |
| ARIA | `role="status"`；恢复时播报「已经重新连上」 |
| 禁用范围 | **所有高影响动作禁用**（发送、确认、批准、锁定、撤回同意、举报提交）。禁用时按 §B.1.4 给出原因文字 |
| 草稿 | 明确说明存在本地；共享设备模式下**不存本地**，文案改为「离线时无法保存草稿。请把内容复制下来，或等连上网络再写。」 |
| 禁令 | 不得让用户以为离线时点的按钮"排队会成功"。没有隐式队列 |

### E.5 同步（Doc 20 §228）

六态，**必须区分"本地已保存"与"服务端已确认"**：

| 状态 | 图标 | 文案 | 颜色 |
|---|---|---|---|
| 本地已保存 | 折角纸 | `已保存在这台设备上 — 还没有上传` | info |
| 正在同步 | 圆弧 | `正在上传…` | info |
| 已同步 | 圆+勾 | `已保存到服务器` | success |
| 冲突 | 双圆错位 | `这一项在别处被改过 — 需要你选择怎么处理` | warning |
| 同步失败 | 八角 | `没有上传成功。内容还在这台设备上，可以再试一次。` | danger |
| 需要复核 | 方框旗 | `已上传，等待工作人员复核` | moderation |

**铁律（Doc 20 §228 末句）**：本地保存**绝不**呈现为"已发布/已发送"。`success` 绿色只允许用于"服务端已确认"。

### E.6 陈旧（Doc 20 §229）

```text
[双圆错位图标] 你看到的内容不是最新的
                这一页是在 {时间} 载入的，之后{对象}被改过。
                现在显示的是最新版本（第 {n} 版）。
                变化：{差异摘要}
                [用最新版本继续]  [先看看变化]
```

| 项 | 规范 |
|---|---|
| 触发 | 服务端版本号 ≠ 页面持有版本号 |
| 行为 | **自动载入最新版**，展示差异，让用户重做或修订 |
| 不可忽略 | Consent / Block / MutualAcceptance / DatasetLock 的陈旧**必须阻断**动作，不给「忽略」选项（Doc 20 §229 末句） |
| 文案 | 不说「你的页面过期了」（指责）；说「这一页是在 {时间} 载入的」（陈述） |

### E.7 版本冲突（I12；Doc 20 §230）

```text
[双圆错位图标] 你的修改和别人的修改撞上了
                你的草稿**没有丢**，也**没有**覆盖别人的修改。
                你的版本（第 {a} 版，你在 {t1} 编辑）
                服务器上的版本（第 {b} 版，{谁} 在 {t2} 编辑）
                [并排比较]
                [合并]  [用服务器版本重来]  [另存为副本]  [取消]
```

| 项 | 规范 |
|---|---|
| 首要保证 | 草稿保留，**禁止静默覆盖**（Doc 20 §230） |
| 必须展示 | 双方版本号、编辑者、编辑时间、差异 |
| 动作 | 合并 / 刷新 / 另存副本 / 取消 —— 按场景提供适用子集，不提供不适用的 |
| 署名 | "别人是谁"仅在该用户对当前用户可见时显示；否则「另一位有权限的工作人员」（受保护存在，§E.9） |
| 严重度 | 阻断级（`role="alert"` + 焦点移入） |

### E.8 错误四级严重度（I13；Doc 20 §232–237）

先说明第 0 级：**信息性**不是错误，**不得使用 warning 样式**（Doc 20 §233）。用 `info` 语义色，`role="status"`，不打断。

| 级别 | 语义色 | 放置 | 持久性 | 打断 | 升级 |
|---|---|---|---|---|---|
| 0 信息性 | info | 就近内联 | 直到状态改变 | 否 | 无 |
| 1 **可恢复** | warning | 出错处就近内联 | 直到解决 | `role="alert"` | 无 |
| 2 **阻断** | danger | 内容区顶部，替换动作区 | 直到解决 | `role="alert"` + 焦点移入 | 提供支持路径 |
| 3 **安全关键** | safety | 模态接管 | 直到人工处理 | `alertdialog` | 路由到问责复核 |
| 4 **安全性关键** | danger（实心） | 模态接管 + 会话处理 | 直到重新认证 | `alertdialog` | 隐藏受保护细节 |

#### 1 级 · 可恢复（§234）

**必备**：保留输入 / 指出如何修正 / 安全重试 / 备选路径 / 求助入口。

```text
[三角] 这条消息还没有保存
       你写的内容还在下面的框里，没有丢。
       原因：内容超过了 2000 字，现在是 2140 字。
       请删掉一些内容再点「保存草稿」。
       > 技术细节：VALIDATION_TOO_LONG
```

其它模式：

- 必填未填：`这一项需要填写：{字段名}。填好之后就可以继续。`（焦点移到该字段）
- 网络瞬断：`没有连上服务器。你写的内容还在。[再试一次]`
- 重试安全性：可安全重试的写「[再试一次]」；不确定是否已生效的写「这次请求可能已经生效了。请先[刷新看看结果]，不要直接重试。」

#### 2 级 · 阻断（§235）

**必备**：说明被挡住的是什么动作 / 不指责 / 保留之前的工作 / 给出明确解决或求助路径。

```text
[八角] 现在不能发布到「园艺角」
        你的草稿已经保存，没有丢，也没有发布出去。
        原因：这个社区的规则在你加入之后更新到了第 3 版，需要你先看过新规则。
        [查看第 3 版规则]
        如果你觉得这不对，可以在「帮助与安全」里联系研究团队。
```

其它模式：

- 前置条件缺失：`要{做这件事}，需要先{前置}。[去{前置}]`
- 状态不允许：`这个{对象}现在是「{状态}」，在这个状态下不能{动作}。[查看状态说明]`
- 双人批准中自批：`这一项是你提交的，需要另一位有权限的同事来批准。[查看还有谁可以批准]`
  > 现有 `staff-queues.test.tsx` 断言 `/是你，不能自批/`。改文案会破坏该测试，见 §G.4。

#### 3 级 · 安全关键（§236）

**必备**：停止不安全的动作 / 紧急与支持选项始终可见 / 路由到问责复核 / **不给虚假安慰**。

```text
[盾形] 这一步先停下来
        我们没有继续刚才的操作。
        你写的内容已经保存，工作人员会看到。

        如果你或其他人现在有危险，请直接拨打当地紧急电话。
        本平台不是紧急求助渠道。

        接下来：这件事会转给工作人员处理，不是由自动系统单独决定。
        [我知道了]  [联系研究团队]
```

| 项 | 规范 |
|---|---|
| 结构 | `role="alertdialog"` + `aria-modal="true"` + 标题关联 |
| 紧急路径 | 紧急电话说明**恒在**，不折叠、不放 `<details>` |
| 禁令 | 不得说「一切正常」「已经安全了」「别担心」；不得承诺响应时间除非有 SLA |
| 人的权威 | 必须写明「由工作人员处理，不是自动系统单独决定」（Doc 20 §13.19） |
| 关闭 | 关闭按钮存在，但关闭不撤销已触发的问责流程；关闭后焦点回触发点 |
| 不阻塞求助 | 该对话框**不得**遮挡「帮助与安全」入口 |

#### 4 级 · 安全性关键（§237）

**必备**：可能结束/限制会话 / 隐藏受保护细节 / 可能要求 step-up 认证 / 给出安全的求助路径。

```text
[实心八角] 为了保护账户，这次操作没有继续
            没有任何内容被更改。
            这次操作需要再确认一次身份。
            [重新验证身份]
            如果不是你本人在操作，请通过{支持渠道}联系我们。
```

| 项 | 规范 |
|---|---|
| 信息最小化 | **不说明具体触发原因**（不泄露检测规则）；不显示 IP、设备、时间等可用于探测的细节 |
| 受保护细节 | 页面上已渲染的敏感内容立即遮蔽 |
| step-up | 若需 MFA：说明为什么需要（「这一步会锁定研究数据集，不能撤销」），不只说"需要 MFA" |
| 会话终止 | 若必须登出：先保存草稿到服务端，登出后提示「你写的内容已经保存，重新登录后还在」 |
| 求助 | 求助渠道必须是**带外**的（不依赖已被限制的会话） |
| 禁令 | 不得指责（「检测到异常行为」→「这次操作需要再确认一次身份」） |

### E.9 受保护存在（I3；ADR-050、Doc 20 §27）

**跨所有状态的统一措辞**。后端已强制不泄露存在性，前端必须有唯一呈现：

```text
[闭锁图标] 找不到这一项
            它可能不存在，也可能你现在看不到它。
            这两种情况我们不做区分，这是为了保护每个人的隐私。
            [回到{上一层}]
```

| 铁律 | 说明 |
|---|---|
| 404 与 403 **前端呈现完全相同** | 不得用不同文案、不同图标、不同颜色 |
| 不得说「你没有权限」 | 那等于确认了对象存在 |
| 不得禁用而非隐藏 | 一个"灰掉的按钮"会泄露"这里有东西" |
| 被屏蔽方视角 | 被屏蔽的人看到的是"找不到"，不是"你被屏蔽了" |
| 加载态也不得泄露 | 不得先渲染骨架再变 404 —— 骨架的形状会泄露对象类型 |

### E.10 严重度不靠 elevation 表达（Doc 20 §319）

安全关键错误的"重要性"由**位置（模态）+ 持久性（不自动消失）+ 文字（明说后果）+ 语义色 + 图标**表达。
**禁止**：把 3/4 级错误的阴影调大、加发光、加边框动画、加声音。

### E.11 会话超时（I14；Doc 20 §238–239）

| 模式 | 警告 | 登出 |
|---|---|---|
| 普通 | 空闲 20 分钟 | 25 分钟 |
| 共享设备 | 空闲 5 分钟 | 7 分钟 |

警告结构（`--layer-live`，最高层）：

```text
[圆弧] 还有 {mm:ss} 就会自动退出
        这是为了保护你的隐私。
        你写的内容已经保存成草稿。
        [继续使用]  [保存并退出]
```

规则：

- 倒计时**必须**同时有文字（不只有进度条），并用 `role="timer"`；每 30 秒更新一次 `aria-live="polite"`（不是每秒，避免刷屏）。
- 超时后敏感内容隐藏，页面显示中性的「已经自动退出。重新登录后可以继续。」
- **超时不得静默作废同意或评估**（Doc 20 §296）：进行中的同意变更/评估在超时前必须落草稿，超时后重新登录可继续。
- 提供「延长」的前提是延长是安全的；共享设备模式下**不提供**无限延长，最多延长一次。

**状态：已实现（2026-08-05）**。两档限时、文字倒计时与 `role="timer"`、整半分钟的 `aria-live="polite"` 播报（由独立的隐藏区域承担——把每秒变化的数字放进朗读区域会把其他一切埋掉）、共享设备最多延长一次而普通模式不限次、超时后回到登录页并显示中性说明，都已落地。

三处按事实偏离本节：

- **不说「你写的内容已经保存成草稿」**：本平台没有任何地方保存草稿，这句话会在它即将被打破的那一刻做出承诺。改说「你打了还没送出或保存的内容会丢失」，并由测试守住原文案不得出现（D-20）。上面那条「超时不得静默作废进行中的同意变更或评估」，在草稿机制存在之前只能靠「先警告、再登出」满足，不能靠「已经存好了」满足。
- **做对话框，不做粘性条**：§D.5 一边把本警告列进粘性元素，一边规定粘性元素总高 ≤ 视口 25%，量出来这两条矛盾——320×844 下这段话占 665px（79%），`xxl` 下 790px。压进 211px 的唯一办法是删掉「会丢什么」那句，而那正是它存在的理由。25% 上限管的是与内容并存的常驻框架元件；打断式警告在那一刻本身就是内容（D-19）。**不加遮罩、不声明 `aria-modal`**：在它后面点一下就是「人还在」，计时器因此重置、警告随即消失。
- **「空闲」只认按下与按键，不认指针移动**：袖子压在触控板上不该等于「人还在」。

---

## §F CSS 草案（可直接粘贴进 `apps/web/src/styles.css`）

> **本草案未写入 `apps/web/src/styles.css`**，按简报要求只作为附录交付。
> 落地方式：**替换**现有文件全部内容（现有 95 行的全部行为都已在本草案中保留或增强：18px 根字号、rem 尺寸、可见焦点、44px 目标、skip-link、reduced-motion、`main li` 块级按钮修补）。
> 落地后需同时执行 §G 中标注为「需要代码改动」的项，否则部分规则（如 flex 间距替代 `{' '}`）不会生效。

```css
/* =============================================================
   健康老龄化研究平台 — 设计系统基座 v0.1
   Doc 20 v1.3 §285–320 / WCAG 2.2 AA
   规则：组件样式只引用 semantic 令牌；本文件之外不得出现字面色值/px/ms。
   ============================================================= */

/* ---------- 1. 令牌：非颜色（主题无关） ---------- */
:root {
  /* -- 能力自适应的两个乘数（§C） -- */
  --scale-font: 1;
  --density: 1;

  /* -- 排版 (§A.2) -- */
  --type-family-ui: system-ui, -apple-system, 'PingFang SC', 'Noto Sans CJK SC',
    'Microsoft YaHei', sans-serif;
  --type-family-mono: ui-monospace, SFMono-Regular, Menlo, 'Noto Sans Mono CJK SC', monospace;

  --type-size-0: 0.833rem;
  --type-size-1: 1rem;
  --type-size-2: 1.125rem;
  --type-size-3: 1.333rem;
  --type-size-4: 1.602rem;
  --type-size-5: 1.924rem;
  --type-size-6: 2.311rem;

  --type-leading-tight: 1.25;
  --type-leading-snug: 1.4;
  --type-leading-normal: 1.6;
  --type-leading-loose: 1.8;

  --type-weight-regular: 400;
  --type-weight-medium: 500;
  --type-weight-semibold: 600;
  --type-weight-bold: 700;

  --type-tracking-normal: 0;
  --type-tracking-mono: 0.02em;

  --measure-narrow: 28rem;
  --measure-default: 36rem;
  --measure-wide: 56rem;

  /* -- 间距 (§A.3)：单一刻度 × 密度乘数 -- */
  --space-0: 0;
  --space-1: calc(0.25rem * var(--density));
  --space-2: calc(0.5rem * var(--density));
  --space-3: calc(0.75rem * var(--density));
  --space-4: calc(1rem * var(--density));
  --space-5: calc(1.5rem * var(--density));
  --space-6: calc(2rem * var(--density));
  --space-7: calc(3rem * var(--density));
  --space-8: calc(4rem * var(--density));
  --space-9: calc(6rem * var(--density));

  /* -- 形状与描边 (§A.4) -- */
  --radius-0: 0;
  --radius-1: 0.25rem;
  --radius-2: 0.5rem;
  --radius-3: 0.75rem;
  --radius-pill: 999rem;
  --border-hairline: 1px;
  --border-default: 2px;
  --border-strong: 3px;
  --border-emphasis: 4px;

  /* -- 焦点 (§A.5)：恒定，不随密度/字号缩放 -- */
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
  --focus-halo-width: 2px;
  --focus-ring-total: calc(var(--focus-ring-width) + var(--focus-ring-offset));

  /* -- 触控目标 (§A.8)：恒定 -- */
  --target-min: 2.75rem;
  --target-gap: 0.5rem;
  --target-hit-slop: 0.25rem;

  /* -- 动效 (§A.6) -- */
  --motion-duration-instant: 0ms;
  --motion-duration-fast: 120ms;
  --motion-duration-normal: 200ms;
  --motion-duration-slow: 320ms;
  --motion-ease-standard: cubic-bezier(0.2, 0, 0.2, 1);
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);

  /* -- 层级 (§A.7)：elevation 不表示置信度或权威 -- */
  --elevation-0: none;
  --elevation-1: 0 1px 2px rgb(11 18 32 / 0.1), 0 0 0 1px rgb(11 18 32 / 0.06);
  --elevation-2: 0 4px 12px rgb(11 18 32 / 0.14), 0 0 0 1px rgb(11 18 32 / 0.08);
  --elevation-3: 0 10px 28px rgb(11 18 32 / 0.2), 0 0 0 1px rgb(11 18 32 / 0.1);
  --layer-base: 0;
  --layer-sticky: 10;
  --layer-header: 20;
  --layer-scrim: 30;
  --layer-dialog: 40;
  --layer-live: 50;

  /* -- 图标 (§A.9) -- */
  --icon-size-1: 1em;
  --icon-size-2: 1.25em;
  --icon-size-3: 1.5em;
  --icon-stroke: 2;
  --icon-gap: var(--space-2);
}

/* ---------- 2. 令牌：颜色 — Light（默认） (§A.1.1) ---------- */
:root {
  --color-surface-page: #ffffff;
  --color-surface-raised: #f7f8fa;
  --color-surface-sunken: #eef0f4;
  --color-surface-inverse: #1b1f26;
  --color-surface-scrim: rgb(11 18 32 / 0.55);

  --color-text-primary: #16191f;   /* 17.60:1 / page */
  --color-text-secondary: #4a5261; /*  7.86:1 / page */
  --color-text-inverse: #ffffff;   /* 16.53:1 / inverse */
  --color-text-link: #14448c;      /*  9.39:1 / page */

  --color-border-subtle: #d5dae2;  /* 装饰专用，1.40:1 */
  --color-border-default: #767e8c; /*  4.09:1 / page */
  --color-border-strong: #414855;  /*  9.20:1 / page */

  --color-action-primary-bg: #1a4fa0;        /* 7.87:1 / page */
  --color-action-primary-fg: #ffffff;        /* 7.87:1 / bg   */
  --color-action-primary-bg-hover: #123b7c;  /* 10.81:1 / fg  */
  --color-action-primary-bg-active: #0d2e62; /* 13.16:1 / fg  */
  --color-action-secondary-fg: #14448c;
  --color-action-secondary-border: #1a4fa0;
  --color-action-secondary-bg-hover: #e8eef8;

  --color-focus-ring: #12233f; /* ≥13.51:1 与任一 surface；15.70:1 与 halo */
  --color-focus-halo: #ffffff;

  --color-info-bg: #e8f1fa;
  --color-info-fg: #0f4c81;        /* 7.76:1 / info-bg */
  --color-info-border: #1a6bb0;    /* 5.56:1 / page */
  --color-success-bg: #e6f4eb;
  --color-success-fg: #14603a;     /* 6.69:1 / success-bg */
  --color-success-border: #1f7a4c; /* 5.32:1 / page */
  --color-warning-bg: #fbf0dc;
  --color-warning-fg: #6e4200;     /* 7.62:1 / warning-bg */
  --color-warning-border: #a16207; /* 4.92:1 / page */
  --color-danger-bg: #fdecec;
  --color-danger-fg: #991b1b;      /* 7.28:1 / danger-bg */
  --color-danger-border: #c02626;  /* 5.92:1 / page */
  --color-danger-solid-bg: #9b1c1c;
  --color-danger-solid-fg: #ffffff; /* 8.15:1 */
  --color-safety-bg: #e9edfa;
  --color-safety-fg: #152a6b;      /* 11.40:1 / safety-bg */
  --color-safety-border: #2b3f8f;  /* 9.50:1 / page */
  --color-moderation-bg: #e3f2f2;
  --color-moderation-fg: #0c5257;  /* 7.73:1 / moderation-bg */
  --color-moderation-border: #12747b; /* 5.51:1 / page */
  --color-ai-bg: #efedf5;
  --color-ai-fg: #46405c;          /* 8.43:1 / ai-bg */
  --color-ai-border: #6a6285;      /* 5.68:1 / page */

  --color-disabled-bg: #f0f1f4;
  --color-disabled-fg: #5f6673;    /* 5.12:1 / disabled-bg */
  --color-disabled-border: #a8aeb9;
}

/* ---------- 3. 令牌：颜色 — Dark (§A.1.2) ---------- */
/* 两套写法并存：媒体查询（无 JS 也生效）+ 属性选择器（用户显式选择优先） */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
    --color-surface-page: #0e1116;
    --color-surface-raised: #161a21;
    --color-surface-sunken: #080a0e;
    --color-surface-inverse: #e9ecf2;
    --color-surface-scrim: rgb(2 4 8 / 0.66);

    --color-text-primary: #e9ecf2;   /* 15.98:1 / page */
    --color-text-secondary: #a8b0be; /*  8.66:1 / page */
    --color-text-inverse: #0e1116;
    --color-text-link: #9cc0ff;      /* 10.26:1 / page */

    --color-border-subtle: #2a3039;
    --color-border-default: #6d7683; /*  4.11:1 / page */
    --color-border-strong: #99a2b0;  /*  7.34:1 / page */

    --color-action-primary-bg: #7fb0ff;        /* 8.61:1 / page */
    --color-action-primary-fg: #08101f;        /* 8.65:1 / bg */
    --color-action-primary-bg-hover: #a6c8ff;
    --color-action-primary-bg-active: #c2daff;
    --color-action-secondary-fg: #9cc0ff;
    --color-action-secondary-border: #7fb0ff;
    --color-action-secondary-bg-hover: #182231;

    --color-focus-ring: #f2f6ff; /* ≥14.19:1 与任一 surface；18.63:1 与 halo */
    --color-focus-halo: #05070b;

    --color-info-bg: #10243a;
    --color-info-fg: #a9cff5;
    --color-info-border: #4c8fd6;
    --color-success-bg: #0e2a1d;
    --color-success-fg: #9fd9b7;
    --color-success-border: #3d9e6b;
    --color-warning-bg: #2e2208;
    --color-warning-fg: #f0ce8a;
    --color-warning-border: #c08a2e;
    --color-danger-bg: #331515;
    --color-danger-fg: #f5afaf;
    --color-danger-border: #d45c5c;
    --color-danger-solid-bg: #f5afaf;
    --color-danger-solid-fg: #1a0808;
    --color-safety-bg: #131a33;
    --color-safety-fg: #bcc9f5;
    --color-safety-border: #7186d6;
    --color-moderation-bg: #0b2628;
    --color-moderation-fg: #9fd6d8;
    --color-moderation-border: #3e9ea4;
    --color-ai-bg: #21202b;
    --color-ai-fg: #c4beda;
    --color-ai-border: #857da5;

    --color-disabled-bg: #171b22;
    --color-disabled-fg: #8b93a1;
    --color-disabled-border: #3a414c;

    /* dark 下阴影不可见：改用描边环作为浮层边界（≥3:1） */
    --elevation-1: 0 0 0 1px var(--color-border-default);
    --elevation-2: 0 0 0 1px var(--color-border-default), 0 4px 12px rgb(0 0 0 / 0.6);
    --elevation-3: 0 0 0 1px var(--color-border-strong), 0 10px 28px rgb(0 0 0 / 0.7);
  }
}
/* 用户显式选择 dark（与上方同值；属性选择器胜出于媒体查询默认） */
:root[data-theme='dark'] {
  --color-surface-page: #0e1116;
  --color-surface-raised: #161a21;
  --color-surface-sunken: #080a0e;
  --color-surface-inverse: #e9ecf2;
  --color-surface-scrim: rgb(2 4 8 / 0.66);
  --color-text-primary: #e9ecf2;
  --color-text-secondary: #a8b0be;
  --color-text-inverse: #0e1116;
  --color-text-link: #9cc0ff;
  --color-border-subtle: #2a3039;
  --color-border-default: #6d7683;
  --color-border-strong: #99a2b0;
  --color-action-primary-bg: #7fb0ff;
  --color-action-primary-fg: #08101f;
  --color-action-primary-bg-hover: #a6c8ff;
  --color-action-primary-bg-active: #c2daff;
  --color-action-secondary-fg: #9cc0ff;
  --color-action-secondary-border: #7fb0ff;
  --color-action-secondary-bg-hover: #182231;
  --color-focus-ring: #f2f6ff;
  --color-focus-halo: #05070b;
  --color-info-bg: #10243a;
  --color-info-fg: #a9cff5;
  --color-info-border: #4c8fd6;
  --color-success-bg: #0e2a1d;
  --color-success-fg: #9fd9b7;
  --color-success-border: #3d9e6b;
  --color-warning-bg: #2e2208;
  --color-warning-fg: #f0ce8a;
  --color-warning-border: #c08a2e;
  --color-danger-bg: #331515;
  --color-danger-fg: #f5afaf;
  --color-danger-border: #d45c5c;
  --color-danger-solid-bg: #f5afaf;
  --color-danger-solid-fg: #1a0808;
  --color-safety-bg: #131a33;
  --color-safety-fg: #bcc9f5;
  --color-safety-border: #7186d6;
  --color-moderation-bg: #0b2628;
  --color-moderation-fg: #9fd6d8;
  --color-moderation-border: #3e9ea4;
  --color-ai-bg: #21202b;
  --color-ai-fg: #c4beda;
  --color-ai-border: #857da5;
  --color-disabled-bg: #171b22;
  --color-disabled-fg: #8b93a1;
  --color-disabled-border: #3a414c;
  --elevation-1: 0 0 0 1px var(--color-border-default);
  --elevation-2: 0 0 0 1px var(--color-border-default), 0 4px 12px rgb(0 0 0 / 0.6);
  --elevation-3: 0 0 0 1px var(--color-border-strong), 0 10px 28px rgb(0 0 0 / 0.7);
}

/* ---------- 4. 能力自适应模式覆盖 (§C) ---------- */
/* 绝不按年龄或分组自动判定：这些属性只能由用户显式设置写到 <html> 上。 */
:root[data-font-scale='lg'] { --scale-font: 1.125; }
:root[data-font-scale='xl'] { --scale-font: 1.25; }
:root[data-font-scale='xxl'] { --scale-font: 1.5; }

:root[data-density='compact'] { --density: 0.75; }
:root[data-density='standard'] { --density: 1; }
:root[data-density='spacious'] { --density: 1.25; }

/* 高对比：OS 信号作初始值，用户显式选择优先 */
@media (prefers-contrast: more) {
  :root:not([data-contrast='standard']) {
    --color-text-primary: #000000;
    --color-text-secondary: #16191f;
    --color-border-subtle: #414855;
    --color-border-default: #16191f;
    --color-border-strong: #000000;
    --color-action-primary-bg: #0b2e6b;
    --color-action-secondary-fg: #0b2e6b;
    --border-default: 3px;
    --icon-stroke: 2.5;
  }
}
:root[data-contrast='high'] {
  --color-text-primary: #000000;         /* 21.00:1 / #ffffff */
  --color-text-secondary: #16191f;
  --color-border-subtle: #414855;
  --color-border-default: #16191f;
  --color-border-strong: #000000;
  --color-action-primary-bg: #0b2e6b;    /* 12.98:1 与 #ffffff 前景 */
  --color-action-secondary-fg: #0b2e6b;
  --border-default: 3px;
  --icon-stroke: 2.5;
}
:root[data-theme='dark'][data-contrast='high'],
:root[data-contrast='high'][data-theme='dark'] {
  --color-surface-page: #000000;
  --color-text-primary: #ffffff;         /* 21.00:1 / #000000 */
  --color-text-secondary: #e9ecf2;
  --color-border-default: #e9ecf2;
  --color-border-strong: #ffffff;
  --color-action-primary-bg: #bbd4ff;    /* 13.97:1 与 #000000 前景 */
  --color-action-primary-fg: #000000;
}

/* 简化模式：隐藏次要内容、加大行高。组件用 .optional 标记可省略的内容。 */
:root[data-simplify='on'] { --type-leading-normal: 1.8; }
:root[data-simplify='on'] .optional { display: none; }

/* 低刺激模式：去掉全部 tint 底，只留描边与文字 */
:root[data-stimulation='low'] {
  --color-info-bg: var(--color-surface-page);
  --color-success-bg: var(--color-surface-page);
  --color-warning-bg: var(--color-surface-page);
  --color-danger-bg: var(--color-surface-page);
  --color-safety-bg: var(--color-surface-page);
  --color-moderation-bg: var(--color-surface-page);
  --color-ai-bg: var(--color-surface-page);
}

/* ---------- 5. 基础排版与文档 ---------- */
:root {
  font-family: var(--type-family-ui);
  font-size: calc(112.5% * var(--scale-font)); /* 18px 基准 × 用户字号 */
  line-height: var(--type-leading-normal);
  color-scheme: light dark;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* 粘性头/尾不得遮住 Tab 到的元素 (§D.5) */
  scroll-padding-block: var(--space-8);
}

html,
body {
  /* 最后一道防线：任何触发它的布局都是缺陷 (§B.3.1) */
  overflow-x: clip;
}

body {
  margin: 0;
  padding: 0;
  color: var(--color-text-primary);
  background-color: var(--color-surface-page);
  /* 长标识符不撑破布局 */
  overflow-wrap: anywhere;
  word-break: normal;
}

h1, h2, h3, h4 {
  line-height: var(--type-leading-tight);
  font-weight: var(--type-weight-semibold);
  margin-block: var(--space-5) var(--space-3);
  text-wrap: balance;
}
h1 { font-size: var(--type-size-5); }
h2 { font-size: var(--type-size-4); }
h3 { font-size: var(--type-size-3); }
h4 { font-size: var(--type-size-2); }

p, li { max-width: var(--measure-default); }
p { margin-block: var(--space-3); }

small { font-size: var(--type-size-0); }
code, kbd, samp {
  font-family: var(--type-family-mono);
  letter-spacing: var(--type-tracking-mono);
  background-color: var(--color-surface-sunken);
  padding-inline: var(--space-1);
  border-radius: var(--radius-1);
}
a { color: var(--color-text-link); }

/* ---------- 6. 应用外壳与布局 ---------- */
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100svh;
}

main {
  display: block;
  width: 100%;
  max-width: var(--measure-default);
  margin-inline: auto;
  padding: var(--space-5) var(--space-4) var(--space-8);
  box-sizing: border-box;
}
/* 员工工作区更宽（Doc 20 §301：员工可用更宽布局） */
main[data-workspace='staff'] { max-width: var(--measure-wide); }

section { margin-block-end: var(--space-6); }

/* 宽内容的唯一合法出口 (§B.3.2) */
.scroll-x {
  overflow-x: auto;
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-2);
}

/* ---------- 7. 焦点：双环，在所有 surface 与状态下可见 (§A.5) ---------- */
:focus-visible {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  /* halo 填满 offset 间隙，使内侧相邻对比 ≥3:1，与元素填充色无关 */
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
  border-radius: var(--radius-1);
}
/* 对话框打开后的编程式聚焦必须可见（此时不是 :focus-visible） */
[role='alertdialog'] :focus,
[role='alertdialog'][tabindex='-1']:focus,
h1[tabindex='-1']:focus,
h2[tabindex='-1']:focus {
  outline: var(--focus-ring-width) solid var(--color-focus-ring);
  outline-offset: var(--focus-ring-offset);
  box-shadow: 0 0 0 var(--focus-halo-width) var(--color-focus-halo);
}
/* 焦点环不得被裁掉 (§A.5) */
.scroll-x,
.card,
li,
section {
  overflow-clip-margin: var(--focus-ring-total);
}

.skip-link {
  position: absolute;
  left: -999rem;
}
.skip-link:focus {
  position: static;
  display: inline-block;
  padding: var(--space-2) var(--space-3);
  background-color: var(--color-surface-inverse);
  color: var(--color-text-inverse);
}

/* ---------- 8. 触控目标：R1–R5 防复发规则 (§B.4) ---------- */
/* R1：--target-min 是唯一来源。R2：交互元素绝不是 inline 级。 */
button,
input,
select,
textarea,
summary,
a[role='button'] {
  font: inherit;
  font-family: var(--type-family-ui);
  min-height: var(--target-min);
  box-sizing: border-box;
}

button,
a[role='button'],
summary {
  display: inline-flex;      /* R2：绝不 display:inline */
  align-items: center;
  justify-content: flex-start;
  gap: var(--icon-gap);
  min-width: var(--target-min);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-1);
  border: var(--border-default) solid var(--color-action-secondary-border);
  background-color: var(--color-surface-page);
  color: var(--color-action-secondary-fg);
  font-weight: var(--type-weight-semibold);
  text-align: start;
  cursor: pointer;
  transition: background-color var(--motion-duration-fast) var(--motion-ease-standard);
}
button:hover,
a[role='button']:hover { background-color: var(--color-action-secondary-bg-hover); }

/* 主动作（每屏至多一个，Doc 20 §13.2） */
.btn-primary {
  background-color: var(--color-action-primary-bg);
  border-color: var(--color-action-primary-bg);
  color: var(--color-action-primary-fg);
}
.btn-primary:hover { background-color: var(--color-action-primary-bg-hover); }
.btn-primary:active { background-color: var(--color-action-primary-bg-active); }

/* 破坏性动作：颜色不是唯一指示，组件必须同时带图标与明确文字 */
.btn-danger {
  border-color: var(--color-danger-border);
  color: var(--color-danger-fg);
}

/* 禁用：必须配说明文字 (§B.1.4)；优先用 aria-disabled 保留可聚焦性 */
button:disabled,
[aria-disabled='true'] {
  background-color: var(--color-disabled-bg);
  border-color: var(--color-disabled-border);
  color: var(--color-disabled-fg);
  cursor: not-allowed;
}

/* R3：间距由布局提供，禁止靠空白文本节点。 */
/* 任何并排的动作组统一用这个容器（替代 JSX 里的 {' '}）。 */
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--target-gap);
  align-items: stretch;
  margin-block: var(--space-4);
}
.actions > button,
.actions > form > button,
.actions > a[role='button'] {
  flex: 1 1 auto;
  min-width: 12rem;          /* R4：换行后每行仍是完整可点块 */
}
/* B.4.4：关键控件与确认按钮的额外净距 */
.actions--critical { gap: var(--space-5); }
/* 确认对话框：取消恒在前，确认在后；窄屏纵向排列 */
.actions--confirm { flex-direction: column; gap: var(--space-5); }
@media (min-width: 40rem) {
  .actions--confirm { flex-direction: row; }
}

/* R4：内容流中的单一动作 = 整行块级目标（保留并推广现有首页的修补） */
main li,
main p { margin-block: var(--space-3); }
main li > button,
main li > form > button,
main li > a[role='button'] {
  display: flex;
  width: 100%;
  text-align: start;
}
main li + li { margin-block-start: var(--target-gap); }

/* R5：包含交互元素的容器不得压缩目标 */
main li,
.card,
.actions {
  height: auto;
  overflow: visible;
}

/* 表单 */
label {
  display: block;
  font-weight: var(--type-weight-medium);
  margin-block-end: var(--space-1);
}
input,
textarea,
select {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding: var(--space-2) var(--space-3);
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-1);
  background-color: var(--color-surface-page);
  color: var(--color-text-primary);
}
textarea { min-height: calc(var(--target-min) * 3); line-height: var(--type-leading-normal); }
fieldset {
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-5);
}
legend { font-weight: var(--type-weight-semibold); padding-inline: var(--space-2); }

/* ---------- 9. 导航 ---------- */
nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--target-gap);
}
nav {
  padding: var(--space-3) var(--space-4);
  border-block-end: var(--border-hairline) solid var(--color-border-subtle);
  background-color: var(--color-surface-raised);
}
nav li { max-width: none; margin: 0; }
/* aria-current 三通道：结构（左条）+ 字重 + 颜色，绝不只靠颜色 */
nav [aria-current='page'] {
  border-inline-start: var(--border-emphasis) solid var(--color-action-primary-bg);
  font-weight: var(--type-weight-bold);
  background-color: var(--color-action-secondary-bg-hover);
}

main ul { padding-inline-start: var(--space-5); }
main ul:not([class]) > li { max-width: var(--measure-default); }

/* ---------- 10. 状态呈现：图标 + 文字 + 颜色 + 结构 (§B.1 / §E) ---------- */
.icon {
  inline-size: var(--icon-size-1);
  block-size: var(--icon-size-1);
  flex: none;
  stroke-width: var(--icon-stroke);
}

/* 行内徽章：文字必须是真实文本节点，绝不用 ::before content */
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--icon-gap);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-pill);
  border: var(--border-hairline) solid currentColor;
  font-size: var(--type-size-1);
  font-weight: var(--type-weight-medium);
}

/* 块级状态容器：第四通道 = 左侧 4px 结构条 */
.state {
  display: flow-root;
  border-inline-start: var(--border-emphasis) solid var(--color-border-strong);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-4);
  background-color: var(--color-surface-raised);
}
.state__head {
  display: flex;
  align-items: center;
  gap: var(--icon-gap);
  margin-block-start: 0;
  font-size: var(--type-size-2);
}
.state__head .icon { inline-size: var(--icon-size-2); block-size: var(--icon-size-2); }
.state__actions { display: flex; flex-wrap: wrap; gap: var(--target-gap); }
.state__detail { margin-block-start: var(--space-3); font-size: var(--type-size-1); }

.state--info,       .badge--info       { background-color: var(--color-info-bg);       color: var(--color-info-fg);       border-inline-start-color: var(--color-info-border); }
.state--success,    .badge--success    { background-color: var(--color-success-bg);    color: var(--color-success-fg);    border-inline-start-color: var(--color-success-border); }
.state--warning,    .badge--warning    { background-color: var(--color-warning-bg);    color: var(--color-warning-fg);    border-inline-start-color: var(--color-warning-border); }
.state--danger,     .badge--danger     { background-color: var(--color-danger-bg);     color: var(--color-danger-fg);     border-inline-start-color: var(--color-danger-border); }
.state--safety,     .badge--safety     { background-color: var(--color-safety-bg);     color: var(--color-safety-fg);     border-inline-start-color: var(--color-safety-border); }
.state--moderation, .badge--moderation { background-color: var(--color-moderation-bg); color: var(--color-moderation-fg); border-inline-start-color: var(--color-moderation-border); }
.state--ai,         .badge--ai         { background-color: var(--color-ai-bg);         color: var(--color-ai-fg);         border-inline-start-color: var(--color-ai-border); }
.state--draft,      .badge--draft      { background-color: var(--color-surface-sunken); color: var(--color-text-secondary); border-inline-start-color: var(--color-border-strong); }

/* 骨架：绝不模仿徽章/按钮/对勾的形状 (§E.2) */
.skeleton {
  background-color: var(--color-surface-sunken);
  border-radius: var(--radius-1);
  block-size: var(--type-size-2);
  margin-block: var(--space-2);
}

/* ---------- 11. 卡片、引用、对话框 ---------- */
.card {
  border: var(--border-default) solid var(--color-border-default);
  border-radius: var(--radius-2);
  padding: var(--space-4);
  margin-block: var(--space-4);
  background-color: var(--color-surface-raised);
  box-shadow: var(--elevation-0); /* 内容卡片不抬升 */
}

blockquote {
  border-inline-start: var(--border-emphasis) solid var(--color-border-strong);
  margin-inline: 0;
  padding-inline-start: var(--space-4);
  color: var(--color-text-secondary);
}

[role='alertdialog'] {
  border: var(--border-emphasis) solid var(--color-border-strong);
  border-radius: var(--radius-2);
  padding: var(--space-5);
  margin-block: var(--space-4);
  background-color: var(--color-surface-page);
  box-shadow: var(--elevation-2);
  z-index: var(--layer-dialog);
  max-width: var(--measure-narrow);
}

/* 上下文横幅（当前身份，共享设备场景恒显） (§D.6) */
.context-banner {
  background-color: var(--color-surface-inverse);
  color: var(--color-text-inverse);
  padding: var(--space-2) var(--space-4);
  position: sticky;
  inset-block-start: 0;
  z-index: var(--layer-header);
}

/* 表格：宽表放进 .scroll-x，不让页面横向滚动 (§B.3.2) */
table { border-collapse: collapse; width: 100%; }
th, td {
  text-align: start;
  padding: var(--space-2) var(--space-3);
  border-block-end: var(--border-hairline) solid var(--color-border-subtle);
  line-height: var(--type-leading-snug);
}
th { font-weight: var(--type-weight-medium); background-color: var(--color-surface-sunken); }

/* ---------- 12. 响应式 (§D)：只用 min-width，移动优先 ---------- */
@media (min-width: 40rem) {
  main { padding-inline: var(--space-5); }
}
@media (min-width: 56rem) {
  main[data-workspace='staff'] { padding-inline: var(--space-6); }
}
/* 矮视口（横屏手机、分屏）取消粘性，避免遮挡关键动作 (§D.5) */
@media (max-height: 30rem) {
  .context-banner { position: static; }
}

/* ---------- 13. 动效与 reduced-motion (§A.6) ---------- */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-fast: 0ms;
    --motion-duration-normal: 0ms;
    --motion-duration-slow: 0ms;
  }
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---------- 14. 打印（研究者导出核对场景） ---------- */
@media print {
  nav, .actions, .skip-link { display: none; }
  main { max-width: none; }
  .state, .card { break-inside: avoid; }
  /* 打印时颜色必然丢失 —— 这正是状态必须带图标与文字的原因 */
}
```

**草案自查（已复核）**：唯一令牌名 **119** 个，`--` 声明合计 **254** 条（颜色 47×2 = 94，非颜色 72，自适应模式覆盖 39，其余为 dark 主题的 elevation 重定义）；组件区零字面色值；`px` 仅出现于描边宽度/焦点环/阴影；`overflow: hidden` 零处；`outline: none` 零处；`content:` 仅出现在 §B.4.2 的命中区扩展伪元素（空字符串，不承载文字）。

---

## §G 对现有 34 个测试与可访问名的影响

### G.0 判定依据（已核实）

`@testing-library/dom@10.4.1` 的 `getNodeText`（`node_modules/.pnpm/@testing-library+dom@10.4.1/.../get-node-text.js:12`）：

```js
Array.from(node.childNodes)
  .filter(child => child.nodeType === TEXT_NODE && Boolean(child.textContent))
  .map(c => c.textContent).join('')
```

**只取直接文本子节点**。由此得出三条可操作结论：

1. 在元素内**新增 `<svg aria-hidden>` 兄弟节点**不影响 `getByText`（SVG 不产生文本节点），也不影响可访问名（`aria-hidden` 从名称计算中剔除）。
2. **把整段文字包进一层 `<span>`** 不会破坏 `getByText('X')`——匹配从父元素转移到该 span，仍是唯一匹配。
3. **把一段被断言的文字拆到两个元素**会破坏断言。这是唯一的真实风险。

### G.1 现状核对

- 34 个测试中查询方式为：`getByRole('button'|'alert'|'alertdialog'|'status'|'note'|'list', {name})`、`getByLabelText`、`getByText`、`textContent.toContain`。
- **无** `getByRole('table' | 'row' | 'cell' | 'grid')` 查询 → §D.4 的表格策略当前无冲突。
- **无** `getByTestId` → 不能靠 test-id 规避。
- `getByRole('list', { name: '消息记录' })` 依赖 `<ol aria-label="消息记录">`；样式化该列表不得移除 `aria-label`。

### G.2 不改变可访问名的改动（可直接执行）

| 改动 | 为什么安全 |
|---|---|
| 全部令牌与基础样式（§F 草案） | 纯 CSS |
| 在状态文字前插入 `<svg class="icon" aria-hidden="true" focusable="false">` | 不产生文本节点；从可访问名计算中剔除 |
| 用 `<div class="actions">` 包裹并排按钮，删除 JSX 中的 `{' '}` | 按钮自身文本不变；`{' '}` 本就是按钮**之外**的文本节点 |
| 给现有元素加 `className` | 不影响角色与名称 |
| `MessagePanel` 中的行内 `style={{...}}` 改为 class | 同上 |
| 给 `<main>` 加 `data-workspace="staff"` | 属性不参与名称计算 |
| 加 `.app-shell` class 到已存在的最外层 `<div>` | 该 `<div>` 已存在 |
| 加「显示与阅读设置」「遮住屏幕」「退出登录」导航项 | **新增**可访问名，不改动已有 6 项 |
| 加空状态/骨架/离线横幅 | 新增元素 |

### G.3 会影响测试但**不**改变可访问名的改动（需同步调整测试）

| 改动 | 影响 | 建议 |
|---|---|---|
| §B.4.4 确认对话框按钮顺序统一为「返回/取消」在前、「确认」在后 | 按名查询不受影响；但若某测试用 `getAllByRole('button')[0]` 或依赖 DOM 顺序，会失败 | 已核对：现有测试**均按名查询**，无序号依赖 → **无需改测试**。此改动落地时需复跑确认 |
| 队列统一为 `<ul>` + CSS Grid 表格外观（§D.4） | 若未来引入 `<table>` 再改回会破坏角色查询 | 现在就定死语义，避免以后返工 |
| `<h1 tabindex="-1">` 焦点管理（§B.2） | `tabindex` 不影响名称/角色 | 无需改测试 |

### G.4 **会改变可访问名或断言文本**的改动（需产品与工程共同确认）

这是唯一需要单列的一节。共 3 项：

**G.4.1 错误码从主文案移入 `<details>`（§E.0 文案宪法第 6 条）**

- 现状：`api.ts` 消费方拼接 `未能获取消息记录：${err.error.code}`、`未成功：${err.error.code}`、`发送确认未成功：${err.error.code}`、`网络错误，草稿未保存` 等，直接渲染进 `role="status"` / `role="alert"`。
- 规范要求：主文案说明「发生了什么 / 内容是否还在 / 什么没有发生 / 下一步」，错误码折进 `<details><summary>技术细节</summary>`。
- **影响**：`role="status"` / `role="alert"` 的 `textContent` 改变。
- **核对结果**：现有 34 个测试中**没有**断言这些错误文案（已 grep：测试只断言 `访问口令`、`与你的账号和权限无关`、`请再点一次刚才的操作`、`对方不会收到通知`、投递状态标签等成功路径文案）。→ **预计零测试破坏**，但改动前必须复跑全量。
- **需要决策**：新错误文案的具体措辞（见 §I.1）。

**G.4.2 「拒绝『开放匹配』」等按钮的图标化（如果采纳）**

- 若在按钮内插入 `<svg aria-hidden>`：可访问名**不变**（`getByRole('button', { name: '拒绝「开放匹配」' })` 仍通过）。
- 若插入的是**带文字的** `<title>` 或 `aria-label`：名称**会变**。
- **本规范的决定**：图标一律 `aria-hidden="true"` 且**永不**携带 `aria-label` / `<title>`。→ **零影响**。此项列出仅为明确禁令。

**G.4.3 `staff-queues.test.tsx` 的「是你，不能自批」文案**

- 现状断言：`screen.getByText(/是你，不能自批/)`。
- §E.8「2 级 · 阻断」的文案模式建议改为：`这一项是你提交的，需要另一位有权限的同事来批准。`——不指责、说明下一步。
- **影响**：该断言**会失败**。
- **需要决策**：是否采纳新措辞（见 §I.1）。若采纳，同步改测试为 `/需要另一位有权限的同事/`。
- 类似候选（同样需决策，当前均未被测试断言）：`密码级别下会被拒绝`、`会被服务端拒绝`——这两条其实已符合"说明原因"的要求，建议**保留原文**，仅补充下一步动作作为第二句（追加句不会破坏 `toContain` 断言）。

### G.5 明确保留、不得改动的文案（已被测试锁定且措辞已合规）

以下文案经核对**符合本规范的诚实与不指责要求**，本设计系统**不建议改动**：

`草稿 — 尚未发送`、`已确认，排队发送中`、`已提交给发送服务`、`发送服务已接受（对方尚未收到）`、`已送达对方`、`发送失败 — 可重试`、`送达状态未知 — 正在核实，不代表成功`、`草稿 — 只有你能看到`、`对方不会收到通知`、`已锁定的研究数据集不会被改写`、`不会由自动系统单独决定`、`本平台不是紧急求助渠道`、`即使你之后屏蔽了对方，这份报告仍会被处理`、`不显示举报人身份`、`是否采纳始终由本人决定`、`不是本人证言`、`与你的账号和权限无关`、`请再点一次刚才的操作`、`不可更改`、`帖子按时间从新到旧显示。`

以及全部 34 个按名查询的按钮文案（`保存草稿`、`确认发布`、`返回，不屏蔽` …）。**设计系统不改按钮文案。**

---

## §H 关键取舍

**H.1｜不引入图标库与图标字体，图标全部内联 SVG，且不存在纯图标按钮。**
代价：图标制作与灰度可辨性验收成为人工工作量；按钮更宽，移动端一行放不下三个动作。
换取：零依赖、离线可用、可访问名恒等于可见文字（与现有 34 个按名查询的测试策略完全对齐），且天然满足 Doc 20 §320「AI/Block/Report/Visibility/Safety/Draft 必须有文字标签」。
放弃的方案：图标+`aria-label` 的紧凑工具栏——它会让可访问名与可见文字分离，中文界面里尤其危险。

**H.2｜不下载 Web 字体，用系统字族。**
代价：跨平台中文字形不一致（PingFang / 微软雅黑 / Noto 的字重与字面不同），设计稿的排版精度下降。
换取：首屏无字体闪烁、离线可读、低带宽下不出现"方块字"，且不产生第三方字体 CDN 的隐私外流（THREAT_MODEL 关注项）。

**H.3｜断点用 `rem` 而非 `px`。**
代价：把浏览器字号调到 32px 的用户，在 1280px 宽的桌面上也会拿到单列布局——员工可能觉得"浪费了屏幕"。
换取：大字用户自动获得单列、无横向滚动的布局，这正是 WCAG 1.4.4/1.4.10 想要的结果。判断：参与者的可读性优先于员工的信息密度。若员工强烈反对，可用 `data-density="compact"` 局部补偿，但断点不改。

**H.4｜三档密度用一个 `--density` 乘数，而不是三套间距刻度；且密度不缩放触控目标、焦点环。**
代价：紧凑模式的压缩幅度受限（只能到 0.75×），做不出真正"Excel 级"的密集表格。
换取：Doc 20 §315 明确要求"不产生互不兼容的独立系统"；更重要的是，任何允许密度压缩 44px 目标的设计都会重演 §B.4 那个真实缺陷。宁可紧凑模式不够紧凑。

**H.5｜Doc 20 §286 的八种能力模式，本系统只交付其中四种（令牌可实现的），并在 §C.2 中如实标注另外四种未交付。**
代价：不能宣称"已支持八种模式"，PILOT_READINESS 相关条目要保持未满足。
换取：Step-by-Step / Read-Aloud / Supporter-Assisted / Extended Time 分别属于流程拆分、TTS 与多模态同意、权限模型、会话策略——把它们塞进令牌层只会产出假的合规声明。这与 Doc 19 的认识论纪律一致：不把设计假设呈现为已实现的能力。

---

## §I 需要产品决策的未决项

**I.1｜错误文案的最终措辞，特别是 `是你，不能自批`（阻塞 §G.4.3）**
§E.8 给出的是模式，不是最终文案。需要决定：(a) 是否统一改写现有员工侧错误文案为"不指责 + 下一步"格式；(b) 若改，`staff-queues.test.tsx` 的断言同步更新由谁执行。
建议：参与者侧文案**必须**改（认知负荷与尊严直接相关）；员工侧可先保留，仅追加第二句动作提示（不破坏 `toContain` 断言）。**需要产品拍板。**

**I.2｜参与者移动端导航：顶部横向滚动 vs 底部固定栏**
Doc 20 §304 说移动端用「bottom or compact primary navigation」，二选一未定。
- 底部栏：拇指可达（老年用户手部灵活度考量），但占用垂直空间、在小视口 + 大字号下会挤压内容，且与 iOS Safari 底部工具栏冲突。
- 顶部横滚：不占垂直空间，但 6 个 44px 项在 320px 宽下必须横滚，而横滚导航对屏幕阅读器与开关设备不友好。
本文件按现状（顶部 `flex-wrap: wrap`）出规范，**但这需要真实用户测试（R3）来决定**，不应由设计代理单方面拍板。

**I.3｜Safety 语义色定为紫色（`#5B2080` / `#D9B8F2`）**
理由是必须与 danger（红）和 moderation（青）三方可分。但紫色在部分文化语境中与哀悼/宗教相关，Doc 20 §320 要求图标"经过文化审查"，颜色同理。**需要文化与伦理评审确认**，尤其在中文语境下。备选：深橙棕（但与 warning 距离过近）。

**I.4｜Read-Aloud（朗读）模式是否纳入原型范围**
Doc 20 §286 列为模式之一，§298–300 规定了语音交互与多模态同意。这牵涉：浏览器 TTS 还是服务端 TTS（后者有数据外流问题，见 THREAT_MODEL）；朗读内容是否包含他人的消息（隐私边界）；共享设备上朗读的隐私风险（§306 明确要求"谨慎"）。
**在产品决定之前，本设计系统不为其预留令牌，也不在设置界面中显示该选项。**

**I.5｜「遮住屏幕」隐私屏与共享设备模式的默认值**
§D.6 规定共享设备模式必须由用户显式勾选。但真实场景（社区中心公用平板）里，最需要这个模式的人最不可能主动勾选。
备选：(a) 由部署方在环境变量中把整个部署实例标记为"共享设备部署"，所有会话强制短超时；(b) 保持用户自选。
(a) 更安全但剥夺个体选择，且改变了同意与会话的语义。**需要伦理与部署方共同决策。**

**I.6｜对比度自动化门是否进 CI**
§A.1.5 建议把全部颜色组合写成单元测试。这会增加一个测试文件与约 90 条断言，并且**任何令牌调整都必须同步更新期望值**。收益是令牌回归可捕获，成本是改配色的摩擦变大。**需要工程决定是否接受这个摩擦。**
