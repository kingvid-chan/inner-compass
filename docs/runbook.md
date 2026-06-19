# inner-compass 运行手册

## 本地安装与启动

```bash
# 安装依赖
python3 -m pip install -r backend/requirements.txt

# 启动（默认监听 127.0.0.1:8000）
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

项目代码无需构建步骤，HTML/CSS/JS 文件可由浏览器直接加载。

## 测试、构建与健康检查

**健康检查：**
```bash
curl http://127.0.0.1:8000/projects/inner-compass/healthz
# → {"status":"healthy","project":"inner-compass","version":"0.0.1"}
```

**静态资源验证：**
```bash
# HTML 文档响应头
curl -sI http://127.0.0.1:8000/projects/inner-compass/ | grep -i cache-control
# → cache-control: no-cache

# CSS/JS 静态文件
curl -sI http://127.0.0.1:8000/projects/inner-compass/css/style.css
# → HTTP/1.1 200 OK, content-type: text/css
```

**浏览器验收流程：**
1. 打开 `http://120.24.117.67/projects/inner-compass/`
2. 确认页面加载，3D 场景可见（坐标轴 + 球体）
3. 拖动任意滑块，确认球体在三维空间中实时移动
4. 确认坐标面板数值同步更新
5. 鼠标拖拽旋转/滚轮缩放 3D 场景

## 环境变量

无需环境变量。所有配置硬编码在 `backend/main.py` 中。

## Base Path

所有路由使用 `/projects/inner-compass/` 前缀：

| 路径 | 说明 |
|---|---|
| `/projects/inner-compass/` | 主页面 (index.html) |
| `/projects/inner-compass/healthz` | 健康检查 |
| `/projects/inner-compass/css/style.css?v=0.0.1` | 样式 |
| `/projects/inner-compass/js/main.js?v=0.0.1` | Three.js 场景 |
| `/projects/inner-compass/js/sliders.js?v=0.0.1` | 参数滑块 |

## 缓存策略

- **HTML 文档**：服务器通过 `Cache-Control: no-cache` HTTP 响应头下发（非 `<meta>` 标签），每次请求重新校验
- **静态资源**：URL 带版本令牌 `?v=0.0.1`，迭代版本递增时自动失效
- **CDN 资源**（Three.js）：由 jsdelivr CDN 管理缓存，URL 固化为 `three@0.160.0`

## Aliyun systemd 与 Nginx

部署服务器：aliyun-cowork (120.24.117.67)

**systemd 服务：** `/etc/systemd/system/codingagent-inner-compass.service`
```
[Unit]
Description=codingagent inner-compass FastAPI
After=network.target

[Service]
User=root
WorkingDirectory=/srv/codingagent/inner-compass
ExecStart=/usr/bin/python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8xxx
Restart=always

[Install]
WantedBy=multi-user.target
```

**Nginx 配置（片段）：**
```nginx
location /projects/inner-compass/ {
    proxy_pass http://127.0.0.1:8xxx;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## 日志查看

```bash
# uvicorn 日志
journalctl -u codingagent-inner-compass -f

# Nginx 访问日志
tail -f /var/log/nginx/access.log | grep inner-compass
```

## 常见故障与恢复

| 问题 | 检查 | 解决 |
|---|---|---|
| 页面 502 | uvicorn 进程是否存活 | `systemctl restart codingagent-inner-compass` |
| 页面白屏 | 浏览器控制台 CDN 加载错误 | 检查 jsdelivr CDN 可达性 |
| 3D 场景不渲染 | WebGL 是否可用 | 浏览器需支持 WebGL |
| 滑块无效 | JS 模块加载错误 | 控制台检查 import 错误 |

## 回滚到精确 Tag

```bash
git checkout v0.0.1  # 未来发布 tag
systemctl restart codingagent-inner-compass
```
