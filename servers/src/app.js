import "dotenv/config";
import express from "express";
import adminRouter from "./app/admin.js";
import userRouter from "./app/user.js";
import cors from "cors";
import corsOptions from "./common/config/cors.js";
import createUsersDB from "./common/db/init.js";

const port = process.env.PORT || 3000;
const app = express();

app.use(cors(corsOptions));
app.use(express.json());

adminRouter(app);
userRouter(app);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

const startServer = async () => {
  try {
    await createUsersDB();

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  }
};

startServer();
