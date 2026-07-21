import {
  findArticles,
  findArticleById,
  findBannerArticles,
  countArticles,
  incrementViews,
} from "../../../admin/modules/article/article.repository.js";
import {
  validateArticleId,
  validatePagination,
} from "../../../admin/modules/article/article.validator.js";

const assertArticleExists = async (id) => {
  const article = await findArticleById(id);

  if (!article) {
    const error = new Error("文章不存在");
    error.statusCode = 404;
    throw error;
  }

  return article;
};

const assertArticlePublished = (article) => {
  if (article.status !== 1) {
    const error = new Error("文章不存在");
    error.statusCode = 404;
    throw error;
  }
};

export const getBannerList = async () => {
  return findBannerArticles(5);
};

export const getArticleList = async (query) => {
  const { page, pageSize } = validatePagination(query);

  const category =
    query.category && typeof query.category === "string"
      ? query.category.trim()
      : undefined;

  const filters = { category, status: 1 };

  const list = await findArticles({ page, pageSize, ...filters });
  const total = await countArticles(filters);

  return { list, total, page, pageSize };
};

export const getArticleDetail = async (id) => {
  const validatedId = validateArticleId(id);
  const article = await assertArticleExists(validatedId);

  assertArticlePublished(article);
  await incrementViews(validatedId);

  return article;
};
