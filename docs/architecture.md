# 自我内在评价三维坐标系 (inner-compass) — 当前架构

## 系统目标与边界

构建一个交互式 Web 3D 单页工具，用户通过调节 7 个内在参数（S/L/Iteration/C/W/F/Delta）实时看到自己在三维坐标系中的位置。无数据库、无用户认证、无路由。

## 技术栈与选择理由

| 层 | 技术 | 理由 |
|---|---|---|
| 前端渲染 | Three.js 0.160 (CDN importmap) | 纯前端 3D，无需构建工具 |
| 前端框架 | 无 (Vanilla JS ES modules) | 需求简单，单页面，零依赖 |
| 后端 | Python FastAPI | 轻量静态文件服务 + healthz，团队熟悉 |
| 部署 | aliyun-cowork Nginx → uvicorn | 项目约束，Nginx 在 port 19011 反向代理 |
| 样式 | 纯 CSS | 无预处理器需求 |

## 模块职责与依赖

```
static/
  index.html          → 页面结构，导入 CSS 和 JS 模块
  css/style.css       → 暗色主题布局（左侧面板 + 右侧画布）
  js/sliders.js       → 7 滑块事件绑定 + 公式计算 + 坐标显示更新
  js/main.js          → Three.js 场景（坐标轴、球体、投影线） + 渲染循环
backend/
  main.py             → FastAPI app（静态文件 + healthz + Cache-Control 中间件）
  requirements.txt    → fastapi, uvicorn[standard]
```

依赖方向：`main.js` → `sliders.js`（单向导入），无循环依赖。

## 数据流、状态流与外部接口

```
用户拖动滑块 → DOM input event
  → sliders.js 读取 7 参数值
  → computeCoordinates(params):
       X = (S × L) × Iteration
       Y = C²
       Z = W − F × Delta
  → 更新坐标显示面板（coord-x/y/z span）
  → 调用 onCoordsChange(coords) → main.js updateSpherePosition()
  → Three.js 下一帧渲染球体到新位置
```

无外部 API 调用。所有计算在前端完成。

## 测试策略

- 后端：curl 验证 healthz 返回 200、HTML 响应包含 Cache-Control: no-cache、静态资源 200
- 前端：浏览器加载页面，拖动滑块验证球体实时移动、坐标面板更新
- 视觉验收：由 Hermes 通过 Kimi 视觉模型完成

## 部署拓扑

```
Browser → http://120.24.117.67:19011/projects/inner-compass/
  → Nginx (port 19011, reverse proxy) → uvicorn (127.0.0.1:8xxx)
  → FastAPI app
```

## 安全边界

- 无用户输入持久化（纯前端）
- 无数据库连接
- 静态文件只读提供
- healthz 端点公开可用（部署监控）

## 已知技术债

- 无（初始版本）

## 关联 ADR 与最近变更

- [ADR-001: 系统架构](decisions/001-architecture.md)
- 迭代: [0.0.1](iterations/0.0.1.md)
