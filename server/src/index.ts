import express from "express";
import cors from "cors";
import settingsRouter from "./routes/settings";
import employeeRouter from "./routes/employee";
import leaveRouter from "./routes/leave";
import authRouter from "./routes/auth";

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use("/api/settings", settingsRouter);
app.use("/api/employees", employeeRouter);
app.use("/api/leave", leaveRouter);
app.use("/api/auth", authRouter);

app.get("/api/health", (req, res) => {
  res.send({ status: "ok" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});