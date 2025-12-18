# PPT Crawler - Ubuntu 部署指南

本指南用于在 Ubuntu 服务器上部署和运行 PPT 爬虫。

## 1. 准备工作

确保服务器已连接互联网，且磁盘空间充足（建议预留 100GB+）。

将项目代码上传至服务器（建议使用 rsync 或 git）。

```bash
# 假设上传到了 ~/ppt-crawler
cd ~/ppt-crawler
```

## 2. 环境安装

进入 `deploy` 目录，运行一键安装脚本：

```bash
cd deploy
chmod +x *.sh
./setup_ubuntu.sh
```

此脚本会自动安装：
- Node.js (v20)
- pnpm
- Playwright 及其系统依赖 (Chromium)

## 3. 数据清理 (可选)

如果是全新部署或需要重置数据，请运行：

```bash
./clean_data.sh
```

**注意**：这会删除 `data/` (数据库) 和 `downloads/` (已下载文件)。

## 4. 运行爬虫

### 方式 A: 前台运行 (测试用)

```bash
# 回到项目根目录
cd ..
npm run build
npm run crawl -- --channel=ppt_xiazai --start=1 --end=5
```

### 方式 B: 后台运行 (生产用)

使用提供的脚本在后台启动任务：

```bash
# 在 deploy 目录下
./start_crawl.sh ppt_xiazai 1 50
```

- 参数 1: 频道 ID (`ppt_xiazai`, `ppt_moban`, `ppt_hangye`, `ppt_jieri`)
- 参数 2: 起始页码
- 参数 3: 结束页码

查看日志：
```bash
tail -f ../crawl.log
```

## 5. 大规模抓取策略 (Best Practices)

虽然脚本支持一次性执行全量抓取（例如 `1-600` 页），但为了稳定性、容错和规避反爬风险，**强烈建议分批次执行**。

### 推荐节奏
建议每次执行 **100-200 页**（约 2000-4000 个 PPT），确认无误后再执行下一批。

**执行计划示例：**

1.  **批次 1 (PPT下载 - 核心)**:
    ```bash
    ./start_crawl.sh ppt_xiazai 1 100
    ```
2.  **批次 2 (PPT下载 - 进阶)**:
    ```bash
    ./start_crawl.sh ppt_xiazai 101 300
    ```
3.  **批次 3 (PPT模板 - 风格)**:
    ```bash
    ./start_crawl.sh ppt_moban 1 281
    ```

**为什么分批？**
- **更稳健**: 防止单次进程运行时间过长导致内存泄漏或意外中断。
- **自动去重**: 系统内置数据库级去重。分批执行时，遇到已下载的 URL 会自动跳过，**不会产生重复文件**。
- **IP安全**: 间歇性休息有助于降低 IP 被目标站点封锁的风险。

## 6. 常见问题

- **权限错误**: 确保脚本有执行权限 (`chmod +x *.sh`)。
- **Playwright 报错**: 可能是系统库缺失，再次运行 `npx playwright install-deps`。
- **403 Forbidden**: 检查服务器 IP 是否被目标站点封锁。尝试降低并发度 (修改 `.env` 中的 `MAX_CONCURRENCY`)。