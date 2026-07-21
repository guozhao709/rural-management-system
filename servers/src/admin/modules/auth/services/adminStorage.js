import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

// 获取data文件夹的绝对地址
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, "../../../../../data/admin");
fs.ensureDirSync(DATA_DIR);

// 管理员信息文件的绝对地址
const ADMIN_FILE = path.resolve(DATA_DIR, "admin.json");

// 读取全部管理员信息
export const readAdmin = async () => {
  try {
    const data = await fs.readJson(ADMIN_FILE);
    return data;
  } catch (err) {
    console.error("Error reading admin file:", err);
    return [];
  }
};

// 追加写入新的信息
export const writeAdmin = async (data) => {
  try {
    const adminArr = await readAdmin();
    adminArr.push(data);
    await fs.writeJson(ADMIN_FILE, adminArr, { spaces: 2 });
    console.log("Admin data written successfully");
    return true;
  } catch (err) {
    console.error("Error writing admin file:", err);
    return false;
  }
};

// 覆盖写入全部信息
export const writeAllAdmin = async (adminArr) => {
  try {
    await fs.writeJson(ADMIN_FILE, adminArr, { spaces: 2 });
    console.log("Admin data written successfully");
    return true;
  } catch (err) {
    console.error("Error writing admin file:", err);
    return false;
  }
};
