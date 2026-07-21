import { execute, queryOne } from "../../../../common/db/index.js";

export const userRegister = async (user) => {
  const { phone, password, name, gender, birthday, address } = user;

  try {
    const result = await execute(
      "INSERT INTO users (phone, password, name, gender, birthday, address) VALUES (?, ?, ?, ?, ?, ?)",
      [phone, password, name, gender, birthday, address],
    );

    return {
      success: true,
      userId: result.insertId,
      affectedRows: result.affectedRows,
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return {
        success: false,
        message: "该手机号已被注册",
      };
    }

    console.error("数据库写入失败", error.message);
    return {
      success: false,
      message: "注册失败，请稍后再试",
    };
  }
};

export const userLogin = async (loginInfo) => {
  const { phone, password } = loginInfo;

  try {
    const user = await queryOne(
      "SELECT * FROM users WHERE phone = ? AND password = ?",
      [phone, password],
    );

    if (!user) {
      return {
        success: false,
        message: "登录失败，手机号或密码错误",
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("数据库查询失败", error.message);
    return {
      success: false,
      message: "登录失败，手机号或密码错误",
    };
  }
};
