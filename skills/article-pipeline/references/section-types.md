## Section 类型

| type | order | 说明 | 内容来源 |
|------|-------|------|---------|
| cover_image | 0 | 封面图 | 第一个帖子的缩略图 URL |
| title | 1 | 文章标题 | LLM 生成 |
| summary | 2 | 文章摘要 | LLM 生成 |
| header | 3 | 头部装饰 | 固定模板或 LLM 生成 |
| toc | 4 | 目录 | 根据帖子列表生成 |
| post_cover_image | 5+i*2 | 帖子封面 | 帖子缩略图 URL |
| post_content | 6+i*2 | 帖子正文 | LLM 基于帖子内容生成 |
| footer | 最后 | 尾部 | 固定模板或 LLM 生成 |
| voiceover_script | — | 配音稿（衍生） | LLM 基于文章内容生成，不参与 assemble |
| content_check | — | 内容检查（衍生） | LLM 检查文章完整性，不参与 assemble |

## 生成注意事项
- post_content 是核心，需包含帖子的关键信息并扩写
- 使用 `csw_prompts_get` 返回的对应 sectionType 的模板
- 每个 post_content 需要对应帖子的完整数据（通过 `csw_posts_get` 并设置 `include_media: true`）
- title 和 summary 需要基于所有帖子的整体主题生成
- 组装前确保所有 section status 为 success
