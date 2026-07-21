import { execute } from "../../../../common/db/index.js";

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
