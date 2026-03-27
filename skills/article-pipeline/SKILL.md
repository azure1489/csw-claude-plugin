---
name: csw-article-pipeline
description: 营事编集室文章生成工具。从 Instagram 帖子生成微信公众号文章，支持选帖、内容生成、编辑修改、发布到微信。当用户提到营事编集室、CSW 文章、帖子选稿、微信发布时触发。
metadata:
  pattern: pipeline
  steps: "7"
---

你正在执行营事编集室文章生成流水线。严格按顺序执行每个步骤。不要跳过步骤，不要在步骤失败时继续推进。

## 前置条件

- CSW MCP Server 已配置（工具可用）

---

## 流程一：主流程（逐步生成文章）

### Step 1 — 选帖

1. 调用 `csw_selections_create` 创建选帖会话
2. 调用 `csw_posts_search` 搜索相关帖子
3. 调用 `csw_selections_add` 将选定帖子加入会话
4. 调用 `csw_selections_show` 展示当前选帖结果

⛔ **GATE：确认选帖完成**
- 向用户展示选帖列表，等待确认后再继续

---

### Step 2 — 创建文章

1. 调用 `csw_articles_create`，传入 `selection_session_id`
2. 调用 `csw_articles_get`，传入 `article_no`，设置 `include_selections: true`，确认文章创建成功并记录所有关联帖子

---

### Step 3 — 加载素材

1. 调用 `csw_prompts_get` 获取各 section 类型的 prompt 模板
2. 调用 `csw_references_list` 列出参考资料
3. 逐个调用 `csw_references_get` 获取参考资料正文

⛔ **GATE：确认模板加载**
- 确认所有需要的 prompt 模板均已获取，再继续生成

---

### Step 4 — 逐 Section 生成

参考 `references/section-types.md` 了解每种 section 类型的说明。

**4a — 元数据 Section（无需 LLM 生成）**
- `cover_image`：使用第一个帖子的缩略图 URL，调用 `csw_sections_create`
- `header`：使用固定模板，调用 `csw_sections_create`

**4b — 全局 Section（LLM 生成）**
- `title`：基于所有帖子的整体主题，用 LLM 生成标题，调用 `csw_sections_create`
- `summary`：基于所有帖子内容，用 LLM 生成摘要，调用 `csw_sections_create`
- `toc`：根据帖子列表生成目录，调用 `csw_sections_create`

**4c — 帖子循环（每个帖子依次处理）**

对每个帖子 `i`（从 0 开始）：
1. 调用 `csw_posts_get`，设置 `include_media: true`，获取帖子完整数据
2. 调用 `csw_sections_create` 创建 `post_cover_image`（order: 5+i\*2），内容为帖子缩略图 URL
3. 使用帖子数据 + 对应 prompt 模板，用 LLM 生成帖子正文
4. 调用 `csw_sections_create` 创建 `post_content`（order: 6+i\*2）

**4d — 尾部 Section**
- `footer`：使用固定模板或 LLM 生成，调用 `csw_sections_create`

完成后，调用 `csw_sections_list` 展示所有 section 列表。

⛔ **GATE：确认内容**
- 向用户展示所有 section，等待确认或修改意见后再继续

---

### Step 5 — 组装

调用 `csw_articles_assemble`，将所有 section 组装为完整文章。

---

### Step 6 — 预览

调用 `csw_articles_preview`，获取并展示 `previewUrl`。

⛔ **GATE：确认预览**
- 向用户展示预览链接，等待确认后再继续

---

### Step 7 — 发布

> ⚠️ 此操作不可逆，发布后文章将推送至微信公众号草稿箱。

调用 `csw_articles_push_wechat`，传入 `article_no` 和 `preview_token`。

---

## 流程二：简化流程（一键生成）

1. 调用 `csw_articles_create_direct` 直接创建并生成文章
2. 执行 **Step 6 — 预览**
3. 执行 **Step 7 — 发布**

---

## 流程三：修改已有文章

1. 调用 `csw_articles_get` 获取文章，调用 `csw_sections_list` 列出所有 section
2. 针对需要修改的 section，调用 `csw_sections_update` 更新内容，展示修改结果
3. 执行 **Step 5 — 组装**
4. 执行 **Step 6 — 预览**
5. 执行 **Step 7 — 发布**（可选）
