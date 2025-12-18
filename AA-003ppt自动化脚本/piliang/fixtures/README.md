fixtures 目录用于端到端小批次冒烟：

- `small_batch_manifest.json`：列出本地已准备好的 input_raw 资产（复用 `AA-003ppt自动化脚本/piliang/data/input_raw` 中现有样本，不额外复制大文件）。
- `mini_batch_manifest.json`：列出 10 条示例 aid（基于 `pachong/downloads/ppt_moban` 的现有下载包），用于生成/验证更大批次冒烟。运行前请先用 Workshop0→A→B→C→D 将这些 aid 写入 `data/input_raw/`。
- 跑冒烟时，请确保 `AA-003ppt自动化脚本/piliang/data/input_raw` 里存在清洗前产物（可通过 Workshop0/WorkshopA/B/C/D 顺流生成）。

推荐流程：

```bash
# 1) 生成标准输入包（Workshop0：crawler.db + downloads -> data/input_raw）
cd AA-003ppt自动化脚本/piliang
python scripts/ingest_crawler.py --manifest fixtures/small_batch_manifest.json
```

示例调用：

```bash
python AA-003ppt自动化脚本/piliang/scripts/run_smoke_batch.py --manifest AA-003ppt自动化脚本/piliang/fixtures/small_batch_manifest.json
# 或
python AA-003ppt自动化脚本/piliang/scripts/run_smoke_batch.py --manifest AA-003ppt自动化脚本/piliang/fixtures/mini_batch_manifest.json
```
