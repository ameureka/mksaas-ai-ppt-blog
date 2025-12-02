以下是根据提供的 PDF 截图提取并整理的 Markdown 格式内容：

# Blog

Learn how to create, manage, and customize blog posts with multi-language support

MkSaaS includes a powerful blog system built with [Fumadocs MDX](https://fumadocs.vercel.app). The blog system supports multi-language content, categories, authors, and rich content formatting, making it ideal for SaaS marketing, announcements, tutorials, and knowledge base articles.

![Blog Screenshot showing Comparisons post](image_placeholder)

## Blog System Structure

The blog system is built using [Fumadocs MDX](https://fumadocs.vercel.app) and integrates with internationalization.

*   **content**
    *   **blog**: Stores blog post MDX files
    *   **author**: Stores author MDX files
    *   **category**: Stores category MDX files
*   **src**
    *   **app/[locale]/(marketing)/blog**: The Next.js page structure for the blog
    *   **components/blog**: React components for the blog
        *   `blog-card.tsx`
        *   `blog-grid.tsx`
        *   `blog-category-filter.tsx`
        *   `blog-toc.tsx`
    *   **lib**
        *   `source.ts`: Configuration for loading MDX content
    *   `source.config.ts`: Schema definitions for MDX content

## Source Configuration

The blog system is configured using Fumadocs MDX in the `source.config.ts` file:

```typescript
// source.config.ts
import { defineCollections, frontmatterSchema } from 'fumadocs-mdx/config';
import { z } from 'zod';

export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    image: z.string(),
    date: z.string().date(),
    published: z.boolean().default(true),
    categories: z.array(z.string()),
    author: z.string(),
  }),
});

// Blog authors collection
export const author = defineCollections({
  type: 'doc',
  dir: 'content/author',
  schema: z.object({
    name: z.string(),
    avatar: z.string(),
    description: z.string().optional(),
  }),
});

// Blog categories collection
export const category = defineCollections({
  type: 'doc',
  dir: 'content/category',
  schema: z.object({
    name: z.string(),
    description: z.string().optional(),
  }),
});
```

Then the blog posts, authors, and categories are loaded using Fumadocs loader in `src/lib/source.ts`:

```typescript
// src/lib/source.ts
import { blog, author, category } from '../../source.config';
import { loader } from 'fumadocs-core/source';
import { createMDXSource } from 'fumadocs-mdx';
import { docsI18nConfig } from '@/i18n';

/**
 * Blog posts source
 */
export const blogSource = loader({
  baseUrl: '/blog',
  i18n: docsI18nConfig,
  source: createMDXSource(blog),
});

/**
 * Blog authors source
 */
export const authorSource = loader({
  baseUrl: '/author',
  i18n: docsI18nConfig,
  source: createMDXSource(author),
});

/**
 * Blog categories source
 */
export const categorySource = loader({
  baseUrl: '/category',
  i18n: docsI18nConfig,
  source: createMDXSource(category),
});

// Type definitions
export type BlogType = InferPageType<typeof blogSource>;
export type AuthorType = InferPageType<typeof authorSource>;
export type CategoryType = InferPageType<typeof categorySource>;
```

## Creating Blog Content

### Adding a New Author

Create a new MDX file in the `content/author` directory:

```md
<!-- content/author/john-doe.mdx -->
---
name: John Doe
avatar: /images/authors/john-doe.jpg
---
```

### Adding a New Category

Create a new MDX file in the `content/category` directory:

```md
<!-- content/category/tutorial.mdx -->
---
name: Tutorial
description: Step-by-step guides to learn new features
---
```

### Adding a New Blog Post

Create a new MDX file in the `content/blog` directory:

```md
<!-- content/blog/my-first-post.mdx -->
---
title: My First Blog Post
description: This is a brief description of my first blog post.
image: /images/blog/my-first-post.jpg
date: "2023-12-01"
published: true
categories: ["tutorial", "announcement"]
author: "mksaas"
---

# Introduction

This is my first blog post. Here I'll talk about something interesting.

## Section 1

Some content here...

## Section 2

More content here...
```

## Multi-language Support

MkSaaS blog system fully supports internationalization. You can create content in multiple languages using the following file naming convention:

1.  **Default locale** (e.g., English): `filename.mdx`
2.  **Other locales** (e.g., Chinese): `filename.zh.mdx`

### Multi-language Authors and Categories

Follow the same pattern for authors and categories:

```md
<!-- content/author/mksaas.zh.mdx -->
---
name: MkSaaS 团队
avatar: /images/authors/mksaas.jpg
---
```

```md
<!-- content/category/announcement.zh.mdx -->
---
name: 公告
description: 官方平台公告和更新
---
```

### Multi-language Blog Post Example

For an English blog post:

```md
<!-- content/blog/welcome-post.mdx -->
---
title: Welcome to our Blog
description: Our first official blog post
image: /images/blog/welcome.jpg
date: "2023-12-01"
published: true
categories: ["announcement"]
author: "mksaas"
---

Content in English...
```

For the same post in Chinese:

```md
<!-- content/blog/welcome-post.zh.mdx -->
---
title: 欢迎来到我们的博客
description: 我们的第一篇官方博客文章
image: /images/blog/welcome.jpg
date: "2023-12-01"
published: true
categories: ["announcement"]
author: "mksaas"
---

Content in Chinese...
```

## Premium Content

You can create premium content by adding the `premium` field set to `true` to the blog post:

```md
<!-- content/blog/premium.mdx -->
---
title: Premium Post
...
premium: true
---

This is the free content part.

...

<PremiumContent>

This is the paid content part.

...

</PremiumContent>
```

If the blog post is premium, there will be a premium badge in the blog card.

![Screenshot of blog list showing a Premium Blog Post card with a badge](image_placeholder)

If user is not logged in, they can only see the free content part.

![Screenshot showing "Sign in to continue reading" lock screen](image_placeholder)

If user is logged in, but they are not a premium user, they can see the free content part.

![Screenshot showing "Unlock Premium Content" upgrade prompt](image_placeholder)

If user is logged in, and they are a premium user, they can see the paid content part.

![Screenshot showing full content access](image_placeholder)

## Advanced Usage

### Customizing the Blog Schema

To add new fields to blog posts, authors, or categories:

1.  Modify the schema in `source.config.ts`
2.  Run the command `pnpm run content` to regenerate the `.source` folder
3.  Update components to display the new fields

Example: Add a "featured" Field

```typescript
// source.config.ts
export const blog = defineCollections({
  type: 'doc',
  dir: 'content/blog',
  schema: frontmatterSchema.extend({
    image: z.string(),
    date: z.string().date(),
    published: z.boolean().default(true),
    categories: z.array(z.string()),
    author: z.string(),
    // Add the new field
    featured: z.boolean().default(false),
  }),
});
```

Then, you can use this field in your blog posts:

```md
<!-- content/blog/important-post.mdx -->
---
title: Important Announcement
description: Read this important announcement
image: /images/blog/announcement.jpg
date: "2023-12-01"
published: true
categories: ["announcement"]
author: "mksaas"
featured: true
---

Content here...
```

Then, run the command `pnpm run content` to regenerate the `.source` folder.

### Querying Posts Programmatically

You can query posts programmatically using the Fumadocs sources:

```typescript
import { blogSource, authorSource, categorySource } from '@/lib/docs/source';

// Get all blog posts
const allPosts = blogSource.getPages();

// Get published posts
const publishedPosts = allPosts.filter(post => post.data.published);

// Get posts by category
const getPostsByCategory = (categorySlug: string) => {
  return allPosts.filter(post => 
    post.data.categories.includes(categorySlug)
  );
};

// Get posts by author
const getPostsByAuthor = (authorSlug: string) => {
  return allPosts.filter(post => post.data.author === authorSlug);
};

// Get all authors
const allAuthors = authorSource.getPages();

// Get all categories
const allCategories = categorySource.getPages();
```

### Changing Blog Post Card Layout

Customize the blog card component in `src/components/blog/blog-card.tsx`:

```tsx
// src/components/blog/blog-card.tsx
import type { BlogType } from '@/lib/docs/source';

interface BlogCardProps {
  post: BlogType;
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <div className="group flex flex-col border rounded-lg overflow-hidden h-full bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* Access post data through post.data */}
      <h3>{post.data.title}</h3>
      <p>{post.data.description}</p>
      <time>{post.data.date}</time>
      {/* ... rest of the component */}
    </div>
  );
}
```

## Build Process

The blog system uses Fumadocs MDX's build process:

1.  **Development**: Content is processed on-demand during development
2.  **Build**: Run `pnpm run content` to generate optimized content sources
3.  **Generated Files**: The `.source` directory contains generated TypeScript files with your content

## Best Practices

1.  **Use High-Quality Images**: Use properly sized and optimized images for blog posts
2.  **Consistent Categories**: Maintain a consistent set of categories across posts
3.  **Strong Meta Content**: Write compelling titles and descriptions for SEO benefits
4.  **Structured Content**: Use proper headings and sections in your blog post content
5.  **Include Table of Contents**: For longer posts, ensure headings are organized for TOC
6.  **International Content**: Keep translations consistent across all localized content
7.  **Optimize Images**: Use responsive images and lazy loading for better performance
8.  **Schema Validation**: Leverage Zod schemas for type-safe content validation

## Video Tutorial

![Video Thumbnail: MkSaaS模板 网站自定义教程](image_placeholder)

## Next Steps

Now that you understand how to work with the blog system in MkSaaS, you might want to explore these related features:

*   **Documentation**: Learn how to create the documentation
*   **i18n**: Configure multi-language support
*   **Newsletter**: Configure newsletter
*   **Website Configuration**: Configure website settings