import {
  createArticle,
  updateArticleById,
  deleteArticleById,
  getArticleList,
  getArticleDetail,
} from "./article.service.js";

const sendSuccess = (res, data, message = "操作成功") => {
  res.json({
    code: 200,
    message,
    data,
  });
};

const sendError = (res, error) => {
  const code = error.statusCode || 500;

  res.status(code).json({
    code,
    message: code === 500 ? "服务端异常" : error.message,
    data: null,
  });
};

export const create = async (req, res) => {
  try {
    const data = await createArticle(req.body);
    sendSuccess(res, data, "创建成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const update = async (req, res) => {
  try {
    const data = await updateArticleById(req.params.id, req.body);
    sendSuccess(res, data, "更新成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const remove = async (req, res) => {
  try {
    const data = await deleteArticleById(req.params.id);
    sendSuccess(res, data, "删除成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const list = async (req, res) => {
  try {
    const data = await getArticleList(req.query);
    sendSuccess(res, data, "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};

export const detail = async (req, res) => {
  try {
    const data = await getArticleDetail(req.params.id);
    sendSuccess(res, data, "获取成功");
  } catch (error) {
    sendError(res, error);
  }
};
