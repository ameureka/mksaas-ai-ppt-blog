
import os
import re
import yaml
import math
from collections import Counter

# Configuration
CONTENT_DIR = "/Users/ameureka/Desktop/mksaas-ai-ppt-blog/content/blog"
RELATED_COUNT = 4

def parse_frontmatter(content):
    match = re.match(r'^---\n(.*?)\n---', content, re.DOTALL)
    if match:
        try:
            return yaml.safe_load(match.group(1)), match.end()
        except yaml.YAMLError:
            return None, 0
    return None, 0

def get_tokens(text):
    # Simple character based tokenizer for Chinese and word based for English
    # Remove some common punctuation
    text = re.sub(r'[^\w\s]', '', text)
    tokens = []
    # Mix of simple word split and char 2-grams for approximate Chinese matching
    words = text.split()
    tokens.extend([w.lower() for w in words if len(w) > 1])

    # 2-grams for Chinese characters
    # Filter out ascii to apply 2-gram only on Chinese loosely
    # For simplicity, we just take 2-grams of the whole string if it contains non-ascii
    text_no_space = text.replace(" ", "").replace("\n", "")
    if any(ord(c) > 128 for c in text_no_space):
        tokens.extend([text_no_space[i:i+2] for i in range(len(text_no_space)-1)])

    return set(tokens)

def load_posts(directory):
    posts = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".mdx"):
                file_path = os.path.join(root, file)
                slug = os.path.splitext(file)[0]

                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    fm, end_idx = parse_frontmatter(content)
                    if not fm:
                        continue

                    body = content[end_idx:]
                    # Weight Title and Keywords (Tags/Category) heavily
                    title = str(fm.get('title', ''))
                    tags = fm.get('tags', [])
                    categories = fm.get('categories', [])

                    # Create a feature text
                    # Repeat title 3 times to boost importance
                    feature_text = (title + " ") * 3 + " ".join(tags) + " " + " ".join(categories) + " " + body[:1000] # Use first 1000 chars of body

                    posts.append({
                        'slug': slug,
                        'filepath': file_path,
                        'tokens': get_tokens(feature_text),
                        'fm': fm,
                        'content_body': body
                    })
    return posts

def compute_similarity(tokens1, tokens2):
    # Jaccard Similarity
    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    if union == 0: return 0
    return intersection / union

def main():
    print("Loading posts...")
    posts = load_posts(CONTENT_DIR)
    print(f"Loaded {len(posts)} posts.")

    updates_count = 0

    print("Computing similarities and updating...")
    for i, post in enumerate(posts):
        scores = []
        for j, other in enumerate(posts):
            if i == j: continue # Skip self
            score = compute_similarity(post['tokens'], other['tokens'])
            scores.append((score, other['slug']))

        # Sort by score desc
        scores.sort(key=lambda x: x[0], reverse=True)
        top_related = [slug for score, slug in scores[:RELATED_COUNT] if score > 0]

        # Determine if update is needed
        current_related = post['fm'].get('relatedPosts', [])
        # We overwrite even if existing, as per user request to "not consider previous ones"

        if top_related:
            post['fm']['relatedPosts'] = top_related

            # Write back
            # We assume PyYaml is available
            new_fm_str = yaml.dump(post['fm'], allow_unicode=True, default_flow_style=False, sort_keys=False)
            new_content = "---\n" + new_fm_str + "---\n" + post['content_body']

            with open(post['filepath'], 'w', encoding='utf-8') as f:
                f.write(new_content)
            updates_count += 1

    print(f"Updated {updates_count} posts with new related links.")

if __name__ == "__main__":
    main()
