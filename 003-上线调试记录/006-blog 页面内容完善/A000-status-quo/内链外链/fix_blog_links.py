
import os
import re
import yaml

# Configuration
CONTENT_DIR = "/Users/ameureka/Desktop/mksaas-ai-ppt-blog/content/blog"
OUTPUT_DIR = "/Users/ameureka/Desktop/mksaas-ai-ppt-blog/003-上线调试记录/006-blog 页面内容完善/A000-status-quo/内链外链"
REPORT_FILE = os.path.join(OUTPUT_DIR, "seo_link_audit_report.md")

def parse_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)), match.end()
        except yaml.YAMLError:
            return None, 0
    return None, 0

def get_all_slugs_and_titles(directory):
    slugs = set()
    title_map = {} # Title -> Slug
    file_map = {} # Slug -> Filepath

    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                slug = os.path.splitext(file)[0]
                slugs.add(slug)
                file_map[slug] = file_path

                # Extract title
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    fm, _ = parse_frontmatter(content)
                    if fm and 'title' in fm:
                        clean_title = fm['title'].strip()
                        title_map[clean_title] = slug

    return slugs, title_map, file_map

def check_external_links(body):
    # Check for http links
    links = re.findall(r'\[([^\]]+)\]\((http[^)]+)\)', body)
    has_external = len(links) > 0
    has_extended_reading = "## 延伸阅读" in body or "## Extended Reading" in body
    return has_external, has_extended_reading

def process_files(all_slugs, title_map, file_map):
    report_lines = ["# SEO Link Audit Report\n"]
    fixed_count = 0
    warning_count = 0

    for slug, filepath in file_map.items():
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        fm, match_end = parse_frontmatter(content)
        if not fm:
            report_lines.append(f"- 🔴 Error parsing frontmatter: `{slug}`")
            continue

        is_modified = False
        file_issues = []

        # 1. Fix Internal Links (relatedPosts)
        if 'relatedPosts' in fm and fm['relatedPosts']:
            new_related = []
            original_related = fm['relatedPosts']
            modified_posts = False

            for post in original_related:
                if post in all_slugs:
                    new_related.append(post) # Already a slug
                elif post in title_map:
                    # Found mapping from title to slug
                    new_related.append(title_map[post])
                    modified_posts = True
                    file_issues.append(f"  - ✅ Internal Link Fixed: `{post}` -> `{title_map[post]}`")
                else:
                     # Attempt fuzzy match or keep broken
                     # For now, keep it, but log it
                     new_related.append(post)
                     file_issues.append(f"  - 🔴 Valid Slug Not Found: `{post}`")

            if modified_posts:
                fm['relatedPosts'] = new_related
                is_modified = True

        # 2. Check External Links
        body = content[match_end:]
        has_ext, has_reading = check_external_links(body)

        if not has_ext and not has_reading:
            file_issues.append("  - 🟡 SEO Warning: No external links or 'Extended Reading' section.")

        # Write back if modified
        if is_modified:
            # Reconstruct content
            # Use yaml dump but handle format carefully to preserve block scalar if possible?
            # PyYaml dump might change formatting. To be safe, we only replace the relatedPosts block using regex if possible,
            # or accept that PyYaml reformats the frontmatter.
            # Here we accept PyYaml reformat for simplicity but check for image multi-line strings.

            # Simple dump
            new_fm_str = yaml.dump(fm, allow_unicode=True, default_flow_style=False, sort_keys=False)
            new_content = "---\n" + new_fm_str + "---\n" + body

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            fixed_count += 1

        if file_issues:
            report_lines.append(f"## File: {os.path.basename(filepath)}")
            report_lines.extend(file_issues)
            warning_count += len(file_issues)

    # Write Report
    report_lines.insert(1, f"**Summary**: Fixed {fixed_count} files. Found {warning_count} issues.\n")

    with open(REPORT_FILE, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))

    print(f"Report generated at: {REPORT_FILE}")

if __name__ == "__main__":
    print("Starting SEO Link Fix & Audit...")
    slugs, title_map, file_map = get_all_slugs_and_titles(CONTENT_DIR)
    print(f"Loaded {len(slugs)} posts.")
    process_files(slugs, title_map, file_map)
    print("Done.")
