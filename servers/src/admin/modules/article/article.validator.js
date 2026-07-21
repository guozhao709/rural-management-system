export const validateArticleId = (id) => {
  const parsed = Number.parseInt(id, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== String(id)) {
    const error = new Error("文章ID必须是正整数");
    error.statusCode = 400;
    throw error;
  }

  return parsed;
};

export const validatePagination = (query) => {
  const page = Number.parseInt(query.page, 10) || 1;
  const pageSize = Number.parseInt(query.pageSize, 10) || 15;

  if (page < 1) {
    const error = new Error("page 必须大于等于 1");
    error.statusCode = 400;
    throw error;
  }

  if (pageSize < 1 || pageSize > 100) {
    const error = new Error("pageSize 必须在 1 到 100 之间");
    error.statusCode = 400;
    throw error;
  }

  return { page, pageSize };
};

export const validateCreateArticle = (body) => {
  if (!body || typeof body !== "object") {
    const error = new Error("请求体不能为空");
    error.statusCode = 400;
    throw error;
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!title) {
    const error = new Error("文章标题不能为空");
    error.statusCode = 400;
    throw error;
  }

  if (!content) {
    const error = new Error("文章内容不能为空");
    error.statusCode = 400;
    throw error;
  }

  return {
    title,
    content,
    summary: typeof body.summary === "string" ? body.summary.trim() : "",
    cover: typeof body.cover === "string" ? body.cover.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    isBanner: body.isBanner === 1 || body.isBanner === true ? 1 : 0,
    isTop: body.isTop === 1 || body.isTop === true ? 1 : 0,
    status: body.status !== undefined ? Number(body.status) : 1,
  };
};

export const validateUpdateArticle = (body) => {
  if (!body || typeof body !== "object") {
    const error = new Error("请求体不能为空");
    error.statusCode = 400;
    throw error;
  }

  const data = {};

  if (body.title !== undefined) {
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title) {
      const error = new Error("文章标题不能为空");
      error.statusCode = 400;
      throw error;
    }
    data.title = title;
  }

  if (body.content !== undefined) {
    const content = typeof body.content === "string" ? body.content.trim() : "";
    if (!content) {
      const error = new Error("文章内容不能为空");
      error.statusCode = 400;
      throw error;
    }
    data.content = content;
  }

  if (body.summary !== undefined) {
    data.summary = typeof body.summary === "string" ? body.summary.trim() : "";
  }

  if (body.cover !== undefined) {
    data.cover = typeof body.cover === "string" ? body.cover.trim() : "";
  }

  if (body.category !== undefined) {
    data.category = typeof body.category === "string" ? body.category.trim() : "";
  }

  if (body.isBanner !== undefined) {
    data.isBanner = body.isBanner === 1 || body.isBanner === true ? 1 : 0;
  }

  if (body.isTop !== undefined) {
    data.isTop = body.isTop === 1 || body.isTop === true ? 1 : 0;
  }

  if (body.status !== undefined) {
    data.status = Number(body.status);
  }

  return data;
};

export const validateArticleQuery = (query) => {
  const filters = {};

  if (query.keyword && typeof query.keyword === "string") {
    filters.keyword = query.keyword.trim();
  }

  if (query.category && typeof query.category === "string") {
    filters.category = query.category.trim();
  }

  if (query.status !== undefined && query.status !== "") {
    filters.status = Number(query.status);
  }

  return filters;
};
