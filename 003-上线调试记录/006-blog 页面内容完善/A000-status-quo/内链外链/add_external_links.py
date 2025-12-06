
import os
import re
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[4]
CONTENT_DIR = ROOT / "content" / "blog"

# Links extracted from PDF and categorized
LINKS_DB = {
    'education': [
        "[Edutopia - 教育创新资源](https://www.edutopia.org/)",
        "[TeachFloor - 最佳 EdTech 博客](https://www.teachfloor.com/blog/best-edtech-blogs-2021)",
        "[Teacher Certification Degrees - 顶级教育博客](https://www.teachercertificationdegrees.com/top-blogs/)"
    ],
    'marketing': [
        "[HubSpot - 生成式引擎优化 (GEO)](https://blog.hubspot.com/marketing/generative-engine-optimization)",
        "[Backlinko - GEO 指南](https://backlinko.com/generative-engine-optimization-geo)",
        "[Digital Marketing Institute - AI 搜索优化](https://digitalmarketinginstitute.com/blog/optimize-content-for-ai-search)"
    ],
    'design': [
        "[PitchWorx - 2025 演示设计趋势](https://pitchworx.com/9-presentation-design-trends-2025-that-will-define-corporate-communication/)",
        "[SlideRabbit - 2025 设计灵感](https://sliderabbit.com/blog/inspiring-2025-presentation-design-trends/)",
        "[Design Shack - 平面设计博客](https://designshack.net/articles/inspiration/graphic-design-blogs/)"
    ],
    'technical': [
        "[Schema.org - Product 结构化数据](https://schema.org/Product)",
        "[Google Search Central - 产品结构化数据](https://developers.google.com/search/docs/appearance/structured-data/product)"
    ]
}

DEFAULT_LINKS = LINKS_DB['design']

def get_category_links(fm):
    cats = fm.get('categories', []) or []
    tags = fm.get('tags', []) or []

    combined = {str(c).lower() for c in cats + tags}
    selected_links = []

    # 分类映射（与当前英文 slug 对齐）
    if any(k in combined for k in ['education', 'training', 'school', 'courseware', 'teaching']):
        selected_links.extend(LINKS_DB['education'])

    if any(k in combined for k in ['marketing', 'product', 'business', 'report', 'job-report', 'year-end', 'proposal', 'paid-search']):
        selected_links.extend(LINKS_DB['marketing'])

    if any(k in combined for k in ['design', 'style', 'color', 'font', 'layout', 'template']):
        selected_links.extend(LINKS_DB['design'])

    if any(k in combined for k in ['schema', 'structured-data', 'json-ld']):
        selected_links.extend(LINKS_DB['technical'])

    if not selected_links:
        selected_links.extend(DEFAULT_LINKS)

    # Deduplicate, limit 3
    seen = set()
    final = []
    for link in selected_links:
        if link not in seen:
            seen.add(link)
            final.append(link)

    return final[:3]

def parse_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)), match.end()
        except yaml.YAMLError:
            return None, 0
    return None, 0

def main():
    print("Processing external links...")
    updated_count = 0

    for root, dirs, files in os.walk(CONTENT_DIR):
        for file in files:
            if file.endswith(".mdx"):
                filepath = Path(root) / file

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                fm, end_idx = parse_frontmatter(content)
                if not fm:
                    # print(f"Skipping {file}: No frontmatter")
                    continue

                links_to_add = get_category_links(fm)
                if not links_to_add: continue

                # Check for existing section
                header_regex = r"(##\s*(延伸阅读|Extended Reading))"
                match = re.search(header_regex, content)

                if match:
                    # Section exists, append links if not present
                    # Find end of section? Usually end of file or next header.
                    # Simple approach: Insert after the header match

                    # First check which links are already there to avoid dupes
                    existing_links_in_file = set()
                    # extract all links in content to be safe
                    existing_urls = re.findall(r'\]\((http[^)]+)\)', content)
                    existing_links_in_file.update(existing_urls)

                    # Filter links_to_add
                    # Extract URL from markdown link string '[Title](URL)'
                    unique_links_to_add = []
                    for link_md in links_to_add:
                        url_match = re.search(r'\((http[^)]+)\)', link_md)
                        if url_match:
                            url = url_match.group(1)
                            if url not in existing_links_in_file:
                                unique_links_to_add.append(link_md)

                    if unique_links_to_add:
                        # Append after the header
                        header_str = match.group(0)
                        insertion_point = match.end()

                        appendix = ""
                        for link in unique_links_to_add:
                            appendix += f"\n- {link}"

                        new_content = content[:insertion_point] + appendix + content[insertion_point:]

                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        updated_count += 1
                else:
                    # Section does not exist, append to end
                    appendix = "\n\n## 延伸阅读\n\n"
                    for link in links_to_add:
                        appendix += f"- {link}\n"

                    with open(filepath, 'a', encoding='utf-8') as f:
                        f.write(appendix)
                    updated_count += 1

    print(f"Updated external links in {updated_count} posts.")

if __name__ == "__main__":
    main()
