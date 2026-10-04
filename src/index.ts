import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import { screensRouter } from "./routes/screens";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:3000" }));
// limit besar karena gambar sementara disimpan sebagai base64 di imageUrl
app.use(express.json({ limit: "20mb" }));

app.use("/screens", screensRouter);

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error(err);
  res
    .status(status)
    .json({ error: status === 500 ? "Internal server error" : err.message });
};
app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => console.log(`API jalan di http://localhost:${port}`));
