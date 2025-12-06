
import os
import re
import yaml

CONTENT_DIR = "/Users/ameureka/Desktop/mksaas-ai-ppt-blog/content/blog"

def parse_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1))
        except yaml.YAMLError:
            return None
    return None

def get_all_slugs(directory):
    slugs = set()
    file_map = {}
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".mdx"):
                slug = os.path.splitext(file)[0]
                slugs.add(slug)
                file_map[slug] = os.path.join(root, file)
    return slugs, file_map

def check_file(filepath, all_slugs):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    frontmatter = parse_frontmatter(content)
    if not frontmatter:
        return {"error": "Invalid Frontmatter"}

    results = {
        "has_related_posts_config": False,
        "valid_related_posts": [],
        "invalid_related_posts": [],
        "has_external_links": False,
        "has_extended_reading_section": False
    }

    # Check Related Posts
    if "relatedPosts" in frontmatter and frontmatter["relatedPosts"]:
        results["has_related_posts_config"] = True
        for post in frontmatter["relatedPosts"]:
            if post in all_slugs:
                results["valid_related_posts"].append(post)
            else:
                results["invalid_related_posts"].append(post)

    # Check Body Content for Links
    body = content.split('---', 2)[-1]

    # Simple regex for markdown links [text](url)
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', body)
    for text, url in links:
        if url.startswith("http"):
            results["has_external_links"] = True
            break

    # Check for Extended Reading Section
    if "## 延伸阅读" in body or "## Extended Reading" in body:
        results["has_extended_reading_section"] = True

    return results

def main():
    all_slugs, file_map = get_all_slugs(CONTENT_DIR)

    report = []

    print(f"Scanning {len(file_map)} blog posts...\n")

    issues_found = 0

    for slug, filepath in file_map.items():
        res = check_file(filepath, all_slugs)

        issues = []
        if "error" in res:
             issues.append(f"🔴 Error: {res['error']}")
        else:
            if not res["has_related_posts_config"]:
                issues.append("🟡 Warning: No 'relatedPosts' configured")
            elif res["invalid_related_posts"]:
                issues.append(f"🔴 Error: Invalid relatedPosts slugs: {res['invalid_related_posts']}")

            if not res["has_extended_reading_section"] and not res["has_external_links"]:
                 issues.append("🟡 Warning: No external links or 'Extended Reading' section found")

        if issues:
            issues_found += 1
            rel_path = os.path.relpath(filepath, CONTENT_DIR)
            print(f"File: {rel_path}")
            for issue in issues:
                print(f"  {issue}")
            print("-" * 40)

    if issues_found == 0:
        print("✅ All posts passed verification!")
    else:
        print(f"\nFound issues in {issues_found} posts.")

if __name__ == "__main__":
    main()
