import {
  findArticles,
  countArticles,
  findArticleById,
  insertArticle,
  updateArticle,
  deleteArticle,
} from "./article.repository.js";
import {
  validateArticleId,
  validatePagination,
  validateCreateArticle,
  validateUpdateArticle,
  validateArticleQuery,
} from "./article.validator.js";

const assertArticleExists = async (id) => {
  const article = await findArticleById(id);

  if (!article) {
    const error = new Error("文章不存在");
    error.statusCode = 404;
    throw error;
  }

  return article;
};

export const createArticle = async (data) => {
  const sanitized = validateCreateArticle(data);
  const result = await insertArticle(sanitized);

  return findArticleById(result.insertId);
};

export const updateArticleById = async (id, data) => {
  const validatedId = validateArticleId(id);
  await assertArticleExists(validatedId);

  const sanitized = validateUpdateArticle(data);
  await updateArticle(validatedId, sanitized);

  return findArticleById(validatedId);
};

export const deleteArticleById = async (id) => {
  const validatedId = validateArticleId(id);
  await assertArticleExists(validatedId);
  await deleteArticle(validatedId);

  return { id: validatedId };
};

export const getArticleList = async (query) => {
  const { page, pageSize } = validatePagination(query);
  const filters = validateArticleQuery(query);

  const list = await findArticles({ page, pageSize, ...filters });
  const total = await countArticles(filters);

  return { list, total, page, pageSize };
};

export const getArticleDetail = async (id) => {
  const validatedId = validateArticleId(id);
  return assertArticleExists(validatedId);
};
