# PPT 爬虫项目 (PPT Crawler)

> **当前状态**: ✅ 全量抓取完成 (2025-12-13)
> **数据位置**: 移动硬盘 `/Volumes/Extreme SSD/pachong_data`

## 1. 项目简介
本项目用于自动化采集 `1ppt.com` 的 PPT 模板资源。
目前已完成四大核心频道（下载、模板、行业、节日）的全量采集，共计约 30,000 个资源。

## 2. 目录结构说明

```bash
/pachong/
├── data/
│   └── crawler.db       # [核心] SQLite数据库，记录了所有已抓取的任务状态，用于去重。
├── downloads/           # [软链接] 指向移动硬盘的快捷方式
│   └── ...              # 实际路径: /Volumes/Extreme SSD/pachong_data/downloads/
├── logs/                # 运行日志
├── deploy/              # 自动化脚本 (start_crawl.sh, auto_monitor.sh)
└── src/                 # 源代码
```

## 3. 增量更新指南 (Incremental Update)

网站每天会有新内容发布。由于数据库 `crawler.db` 已经记录了历史所有任务，您不需要重新跑全量，只需执行 **增量抓取**。

### 策略：只爬前 5-10 页
通常新发布的资源都在列表页的最前面。

### 操作步骤
建议每周或每月执行一次以下命令：

```bash
cd deploy

# 1. 更新 "PPT下载" 频道前 10 页
./start_crawl.sh ppt_xiazai 1 10

# 2. 更新 "PPT模板" 频道前 10 页
./start_crawl.sh ppt_moban 1 10

# 3. 更新 "行业PPT" 频道前 5 页
./start_crawl.sh ppt_hangye 1 5

# 4. 更新 "节日PPT" 频道前 5 页
./start_crawl.sh ppt_jieri 1 5
```

**原理**:
*   爬虫会扫描这些页面的所有链接。
*   **遇到旧资源**: 数据库会发现 `url` 已存在且状态为 `COMPLETED`，直接跳过，不下载，不消耗流量。
*   **遇到新资源**: 数据库中无记录，自动添加任务并下载。

## 4. 移动硬盘与数据维护

### ⚠️ 关键注意事项
由于 `downloads` 文件夹是一个**软链接 (Symbolic Link)**，它依赖于移动硬盘的挂载路径。

### 如果您拔掉了硬盘
*   项目代码依然可以运行，但下载会报错（找不到路径），或者写入到本地空目录。
*   **请务必先插入移动硬盘**再运行爬虫。

### 如果移动硬盘挂载名变了
如果您换了电脑，或者硬盘挂载路径不再是 `/Volumes/Extreme SSD`，您需要修复链接：

1.  **删除旧链接**:
    ```bash
    rm downloads
    ```
    *(注意：这只是删除快捷方式，不会删除数据)*

2.  **建立新链接**:
    假设新路径是 `/Volumes/NewDisk/pachong_data/downloads`
    ```bash
    ln -s "/Volumes/NewDisk/pachong_data/downloads" downloads
    ```

### 数据备份
建议定期将本地的 `data/crawler.db` 复制到移动硬盘作为备份，因为它是整个项目的“大脑”。如果数据库丢了，增量更新就会失效（会导致全量重复下载）。

```bash
# 手动备份数据库命令
cp data/crawler.db "/Volumes/Extreme SSD/pachong_data/data/crawler.db_backup_$(date +%Y%m%d)"
```

## 5. 常用命令速查

*   **安装依赖**: `pnpm install`
*   **编译代码**: `npm run build`
*   **查看状态**: `sqlite3 data/crawler.db "SELECT status, count(*) FROM tasks GROUP BY status;"`
*   **清理日志**: `rm logs/*.log`

---
*Maintained by Gemini CLI Agent*
