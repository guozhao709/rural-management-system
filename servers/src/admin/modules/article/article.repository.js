import { execute, query, queryOne } from "../../../common/db/index.js";

const buildWhereClause = ({ keyword, category, status }) => {
  const conditions = [];
  const params = [];

  if (keyword) {
    conditions.push("title LIKE ?");
    params.push(`%${keyword}%`);
  }

  if (category) {
    conditions.push("category = ?");
    params.push(category);
  }

  if (status !== undefined && status !== null && status !== "") {
    conditions.push("status = ?");
    params.push(status);
  }

  return {
    whereClause: conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "",
    params,
  };
};

export const findArticles = async ({ page, pageSize, keyword, category, status }) => {
  const { whereClause, params } = buildWhereClause({ keyword, category, status });
  const offset = (page - 1) * pageSize;

  return query(
    `
SELECT
  id,
  title,
  summary,
  content,
  cover,
  category,
  is_banner AS isBanner,
  is_top AS isTop,
  status,
  views,
  create_time AS createTime,
  update_time AS updateTime
FROM article
${whereClause}
ORDER BY is_top DESC, create_time DESC
LIMIT ? OFFSET ?
`,
    [...params, pageSize, offset],
  );
};

export const countArticles = async ({ keyword, category, status }) => {
  const { whereClause, params } = buildWhereClause({ keyword, category, status });
  const row = await queryOne(`SELECT COUNT(*) AS total FROM article ${whereClause}`, params);
  return row.total;
};

export const findArticleById = async (id) => {
  return queryOne(
    `
SELECT
  id,
  title,
  summary,
  content,
  cover,
  category,
  is_banner AS isBanner,
  is_top AS isTop,
  status,
  views,
  create_time AS createTime,
  update_time AS updateTime
FROM article
WHERE id = ?
`,
    [id],
  );
};

export const findBannerArticles = async (limit) => {
  return query(
    `
SELECT
  id,
  title,
  summary,
  content,
  cover,
  category,
  is_banner AS isBanner,
  is_top AS isTop,
  status,
  views,
  create_time AS createTime,
  update_time AS updateTime
FROM article
WHERE status = 1 AND is_banner = 1
ORDER BY is_top DESC, create_time DESC
LIMIT ?
`,
    [limit],
  );
};

export const insertArticle = async (data) => {
  return execute(
    `
INSERT INTO article (title, summary, content, cover, category, is_banner, is_top, status)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`,
    [
      data.title,
      data.summary ?? "",
      data.content,
      data.cover ?? "",
      data.category ?? "",
      data.isBanner ?? 0,
      data.isTop ?? 0,
      data.status ?? 1,
    ],
  );
};

export const updateArticle = async (id, data) => {
  const fields = [];
  const params = [];

  if (data.title !== undefined) {
    fields.push("title = ?");
    params.push(data.title);
  }
  if (data.summary !== undefined) {
    fields.push("summary = ?");
    params.push(data.summary);
  }
  if (data.content !== undefined) {
    fields.push("content = ?");
    params.push(data.content);
  }
  if (data.cover !== undefined) {
    fields.push("cover = ?");
    params.push(data.cover);
  }
  if (data.category !== undefined) {
    fields.push("category = ?");
    params.push(data.category);
  }
  if (data.isBanner !== undefined) {
    fields.push("is_banner = ?");
    params.push(data.isBanner);
  }
  if (data.isTop !== undefined) {
    fields.push("is_top = ?");
    params.push(data.isTop);
  }
  if (data.status !== undefined) {
    fields.push("status = ?");
    params.push(data.status);
  }

  if (fields.length === 0) {
    return { affectedRows: 0 };
  }

  fields.push("update_time = CURRENT_TIMESTAMP");
  params.push(id);

  return execute(`UPDATE article SET ${fields.join(", ")} WHERE id = ?`, params);
};

export const deleteArticle = async (id) => {
  return execute("DELETE FROM article WHERE id = ?", [id]);
};

export const incrementViews = async (id) => {
  return execute("UPDATE article SET views = views + 1 WHERE id = ?", [id]);
};
