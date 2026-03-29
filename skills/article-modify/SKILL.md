---
name: csw-article-modify
description: 修改已有的营事编集室文章。当用户要求修改营事编集室文章分段、更新内容、或调整已生成的文章时触发。
metadata:
  pattern: pipeline
  steps: "5"
---

你正在执行营事编集室文章修改流程。这是专门用于修改营事编集室文章的流程。严格按顺序执行每个步骤。不要跳过步骤，不要在步骤失败时继续推进。

## 前置条件

- CSW MCP Server 已配置（工具可用）
- 已有文章编号（article_no）

---

## Step 1 — 定位

1. 调用 `csw_articles_get` 获取文章详情
2. 调用 `csw_sections_list` 列出所有 section，展示给用户

确认需要修改的 section，记录其 `section_id` 和当前内容。

---

## Step 2 — 修改

对每个需要修改的 section：
1. 根据用户要求生成新内容
2. 调用 `csw_sections_update` 更新 section 内容
3. 展示修改结果

⛔ **GATE：确认修改**
- 展示所有已修改的 section，等待用户确认后再继续

---

## Step 3 — 重组装

调用 `csw_articles_assemble`，将修改后的 section 重新组装为完整文章。

---

## Step 4 — 预览

调用 `csw_articles_preview`，获取并展示 `previewUrl`。

⛔ **GATE：确认预览**
- 向用户展示预览链接，等待确认后再继续

---

## Step 5 — 发布（可选）

> ⚠️ 此操作不可逆，发布后文章将推送至微信公众号草稿箱。

如果用户确认发布，调用 `csw_articles_push_wechat`，传入 `article_no` 和 `preview_token`。
