# ADR-001: 系统架构 — 自我内在评价三维坐标系

## 状态

已接受

## 背景

构建一个纯前端交互式 Web 3D 工具，用户通过 7 个滑块调节内在参数，实时看到自己在三维坐标系中的位置。无需数据库、无需用户认证、无需路由。

## 决策

### 1. 单页面架构 (SPA)

**选择**：单 HTML 文件，无路由框架，无前端构建工具。
**理由**：需求只有单一交互页面，引入路由或框架会增加不必要的复杂度。CLAUDE.md 明确禁止 build tool。

### 2. Three.js 通过 CDN 引入

**选择**：`<script type="importmap">` 从 jsdelivr CDN 加载 Three.js。
**理由**：无需 npm、无需打包。importmap 支持现代浏览器的 ES module 原生导入。

### 3. FastAPI 静态文件服务

**选择**：Python FastAPI 挂载 `StaticFiles` 提供前端资源，同时提供 `/projects/inner-compass/healthz` 健康检查端点。
**理由**：团队熟悉 Python，FastAPI 轻量且支持异步，满足部署约束（aliyun-cowork + systemd + Nginx）。

### 4. 前端模块拆分

| 文件 | 职责 |
|---|---|
| `static/index.html` | 页面结构：Three.js 画布、滑块面板、坐标显示 |
| `static/css/style.css` | 布局与样式 |
| `static/js/main.js` | Three.js 初始化、场景构建、渲染循环、坐标更新接口 |
| `static/js/sliders.js` | 滑块事件绑定、公式计算、触发坐标更新 |

### 5. 数据流

```
Slider input → sliders.js (公式计算) → main.js (updateSphere) → Three.js render
                                   ↘ main.js (updateDisplayPanel)
```

单向数据流，无状态管理库。sliders.js 是计算层，main.js 是视图层。

### 6. 渲染策略

- Three.js `WebGLRenderer`，`requestAnimationFrame` 持续渲染
- 默认添加 `OrbitControls` 支持旋转/缩放
- 仅当滑块值变化时更新球体位置（避免每帧重算）
- 场景元素：三轴（X红/Y绿/Z蓝）、刻度标记、轴标签（CSS2DRenderer 或 Sprite）、半透明参考网格面

### 7. 缓存策略

- HTML 文档通过 FastAPI 中间件注入 `Cache-Control: no-cache` 响应头
- 静态资源 URL 带 `?v=0.0.1` 版本令牌，路径保留 `/projects/inner-compass/` 前缀

### 8. 部署拓扑

```
Browser → Nginx (port 19011) → FastAPI (uvicorn, 127.0.0.1:8xxx)
         /projects/inner-compass/* → proxy_pass FastAPI
```

## 文件结构

```
backend/
  main.py              # FastAPI app
  requirements.txt     # fastapi, uvicorn
static/
  index.html           # 入口页面
  css/
    style.css          # 样式
  js/
    main.js            # Three.js 场景
    sliders.js         # 滑块与公式
docs/
  architecture.md
  runbook.md
  decisions/
    001-architecture.md
  iterations/
    0.0.1.md
    0.0.1-tasks.md
evidence/
  claude/
    technical_plan-0.0.1.json
    tasks_defined-0.0.1.json
    self_test-0.0.1.json
    handoff-0.0.1.json
```

## 后果

- 正面：零构建步骤，直接可用；代码量少，易维护
- 负面：无 TypeScript 类型检查；CDN 依赖外部网络
- 风险：Three.js 版本升级可能导致 breaking change，通过固定 CDN URL 版本号缓解
