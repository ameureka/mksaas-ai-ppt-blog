✦ 我明白了。您不仅有标题，还有已经写好的 Markdown (.mdx) 文章内容（如截图中所示的 产品营销与营销方案PPT
  目录下的文件）。您希望利用 Nanobanana（即 Gemini 的图像生成能力），为这 100 篇文章：

   1. 生成封面：必须包含文章标题文字，风格统一。
   2. 生成配图：必须基于文章的具体内容（Content-Aware），贴切且有助于 SEO。
   3. 批量化：需要一个高效的流程。

  以下是修正后的“内容感知型 (Content-Aware) 批量生图方案”：

  ---

  修正方案核心：Prompt Engineering Pipeline (提示词工程流水线)

  既然您有文章内容，我们不仅要用标题生成 Prompt，更要让 AI 阅读文章内容来生成 Prompt。

  步骤 1: 自动化提取与 Prompt 生成 (The "Prompt Extractor")

  我们需要一个脚本（我可以用 Python 为您写），它会遍历您的 .mdx 文件，读取内容，然后调用 LLM（Gemini
  Flash/Pro）为每篇文章生成一个 JSON 配置。

  Prompt Extractor 的工作逻辑：
   1. 读取：读取 产品营销PPT一般包含哪些内容.zh.mdx 的全文。
   2. 分析：分析文章的核心知识点（例如：包含市场分析、用户画像、营销策略）。
   3. 生成封面 Prompt：
       * 提取标题：“产品营销PPT一般包含哪些内容”
       * 设计指令：Design a minimalist blog cover. Center text: "产品营销PPT内容". Background: A 3D
         collage of marketing icons (funnel, target, bullhorn) arranged neatly on a glass shelf.
         Professional blue and orange color scheme.
   4. 生成配图 Prompt：
       * 找到关键段落（如“市场分析部分”）。
       * 设计指令：An isometric illustration showing a data analyst looking at a large pie chart and a
         rising trend line on a screen. Clean, tech style.
   5. 输出：保存为 assets_generation.json。

  步骤 2: Nanobanana (Gemini) 的文字渲染挑战与对策

  痛点：目前所有 AI（包括 Gemini/Imagen
  3）在渲染长中文句子（如“产品营销PPT推荐页数按三种场景拆分”）时，错误率极高（可能会写成乱码或错别字）。

  修正策略（针对您的 Nanobanana 场景）：
   * 方案 A (赌 AI 能力)：在 Prompt 中强制要求渲染中文。如果 Nanobanana 背后的模型是 Imagen
     3，成功率尚可，但 100 篇里可能有一半需要重抽。
   * 方案 B (英文/短词替代)：封面大字用英文（如 "Marketing PPT
     Structure"），下方用小字或留白给您后期加中文。
   * 方案 C (我的推荐 - 混合模式)：
       * 让 Prompt 生成“带有文字占位符的图”（例如：A blank whiteboard in the center surrounded by
         marketing elements）。
       * 或者，生成极短中文关键词（如“产品营销”四个字，AI 通常能写对），副标题太长就不让 AI 写了。

  步骤 3: 执行细节 (Execution Detail)

  鉴于您没有 API 权限，只能用账号手动/半自动生成：

  1. 生成 Prompt 清单 (自动化)
  我写一个 Python 脚本，扫描您的文件夹，读取每个 .mdx，生成一个 image_tasks.md 文件。

  `image_tasks.md` 示例：

    1 ## 文章 001: 产品营销PPT一般包含哪些内容.zh.mdx
    2
    3 ### 1. 封面图 (Cover)
    4 **文件名**: `product-marketing-content-cover.png`
    5 **中文标题**: 产品营销PPT内容
    6 **Nanobanana Prompt**:
    7 > /generate_image prompt="A professional blog post cover image. In the center, clearly render the
      Chinese text '产品营销PPT' in a bold, modern font. The background features a 3D isometric compositio
      of marketing elements: a megaphone, a sales funnel, and a bar chart. Soft studio lighting, corporate
      blue and orange palette. High quality, 4k."
    8
    9 ### 2. 插图 A (针对'市场分析'段落)
   10 **文件名**: `market-analysis-chart.png`
   11 **Nanobanana Prompt**:
   12 > /generate_image prompt="A flat vector illustration representing market analysis. A magnifying glas
      focusing on a segment of a pie chart. Clean lines, minimal details, matching the corporate blue and
      orange color scheme."

  2. 逐个生成 (人工/Nanobanana)
  您打开这个 Markdown 文件：
   1. 复制第一条 /generate_image ... 命令。
   2. 粘贴给 Gemini (开启 Nanobanana)。
   3. 看图 -> 满意 -> 保存为指定文件名。
   4. 不满意 -> 让 Gemini "Try again with a simpler background"。

  3. 回填与 SEO (自动化)
  图片生成好并放入指定文件夹后，我再写一个脚本，把图片链接插入回 .mdx 文件中，并自动添加 alt
  属性（基于文章关键词，SEO 优化）。
