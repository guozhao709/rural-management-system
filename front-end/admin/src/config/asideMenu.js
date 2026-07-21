export const menuList = [
  {
    index: "key1",
    name: "仪表盘",
    path: "/dashboard",
    roles: ["super_admin", "common_admin"],
  },
  {
    index: "key2",
    name: "管理员管理",
    path: "/admin",
    roles: ["super_admin"],
  },
  {
    index: "key3",
    name: "村民列表",
    path: "/villagers",
    roles: ["super_admin", "common_admin"],
  },
  {
    index: "key4",
    name: "系统设置",
    path: "/settings",
    roles: ["super_admin"],
  },
  {
    index: "key5",
    name: "村民聊天",
    path: "/chat",
    roles: ["super_admin", "common_admin"],
  },
  {
    index: "key6",
    name: "文章管理",
    path: "/article",
    roles: ["super_admin", "common_admin"],
  }
];
