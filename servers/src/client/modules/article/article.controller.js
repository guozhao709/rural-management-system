import { getBannerList, getArticleList, getArticleDetail } from "./article.service.js";

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

export const banner = async (req, res) => {
  try {
    const data = await getBannerList();
    sendSuccess(res, data, "获取成功");
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
