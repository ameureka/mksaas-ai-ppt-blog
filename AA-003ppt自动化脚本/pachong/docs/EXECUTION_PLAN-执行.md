# 全量抓取执行清单 (Execution Manifest)

> **总目标**: 抓取 `ppt_xiazai`, `ppt_moban`, `ppt_hangye`, `ppt_jieri` 四大频道。
> **策略**: 分 8 个批次执行，确保稳定性与全覆盖。

---

## 🚀 第一阶段：攻克核心 (PPT下载)
*资源最丰富，场景化分类，建议优先执行。*

### 批次 1 (P1-P150)
```bash
cd ~/ppt-crawler/deploy
./start_crawl.sh ppt_xiazai 1 150
```
*(执行后建议检查 `crawl.log` 确认无误)*

### 批次 2 (P151-P300)
```bash
./start_crawl.sh ppt_xiazai 151 300
```

### 批次 3 (P301-P450)
```bash
./start_crawl.sh ppt_xiazai 301 450
```

### 批次 4 (P451-末页)
```bash
./start_crawl.sh ppt_xiazai 451 634
```

---

## 🎨 第二阶段：补充风格 (PPT模板)
*视觉风格基础库。*

### 批次 5 (P1-P150)
```bash
./start_crawl.sh ppt_moban 1 150
```

### 批次 6 (P151-末页)
```bash
./start_crawl.sh ppt_moban 151 281
```

---

## 🔍 第三阶段：查漏补缺 (行业 & 节日)
*利用数据库去重机制，快速扫描聚合入口，捕获漏网之鱼。*

### 批次 7 (行业全量)
```bash
./start_crawl.sh ppt_hangye 1 282
```

### 批次 8 (节日全量)
```bash
./start_crawl.sh ppt_jieri 1 305
```

---

## ✅ 检查进度命令
查看实时日志：
```bash
tail -f ~/ppt-crawler/crawl.log
```

查看已下载文件数量：
```bash
find ~/ppt-crawler/downloads -name "*.zip" | wc -l
```
