// 生成管理员id
// 获得Id前缀
const getPrefixByRole = (role) => {
  let prefix = "c"; // 默认为c
  switch (role) {
    case "super_admin":
      prefix = "s";
      break;
    case "common_admin":
      prefix = "c";
      break;
    default:
      throw new Error("未知权限");
  }
  return prefix;
};

// 得到Id后缀
const getIdSuffix = (id) => {
  return parseInt(id.slice(1), 10);
};

// 生成id函数
export const generateAdminId = (admins, role) => {
  const prefix = getPrefixByRole(role);

  // 如果没有原始数据
  if (admins.length === 0) {
    return `${prefix}01`;
  }

  // 正常设置id, 先找最大的id后缀, 再加1作为新ID
  let max = 0;
  admins.forEach((admin) => {
    if (admin.role === role) {
      let idSuf = getIdSuffix(admin.adminID);
      max = max > idSuf ? max : idSuf;
    }
  });
  max++;
  return max < 10 ? `${prefix}0${max}` : `${prefix}${max}`;
};
