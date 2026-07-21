import { execute, query, queryOne } from "../../../../common/db/index.js";

export const getVillagers = async () => {
  return query("SELECT * FROM users");
};

export const getVillagersByPage = async (page, pageSize) => {
  const offset = (page - 1) * pageSize;

  return query(
    `
SELECT * FROM users
LIMIT ? OFFSET ?
`,
    [pageSize, offset],
  );
};

export const getVillagersCount = async () => {
  const row = await queryOne("SELECT COUNT(*) AS total FROM users");
  return row.total;
};

export const deleteVillagerById = async (id) => {
  return execute("DELETE FROM users WHERE id = ?", [id]);
};

export const updateVillagerById = async (id, updateData) => {
  const { name, phone, address, birthday, gender, password } = updateData;

  return execute(
    `
UPDATE users
SET name = ?, phone = ?, address = ?, birthday = ?, gender = ?, password = ?
WHERE id = ?
`,
    [name, phone, address, birthday, gender, password, id],
  );
};
