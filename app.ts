import express from "express";
import { config } from "dotenv";
import topicsRouter from "./src/routes/topicsRoutes";
import tipsRouter from "./src/routes/tipsRoutes";
import postsRouter from "./src/routes/postsRoutes";
import authRoutes from "./src/routes/authRoutes";
import { v2 as cloudinary } from "cloudinary";
import fileUpload from "express-fileupload";
import { errorHandler } from "./src/middleware/errorHandler";

config();

const app = express();
const PORT = process.env.PORT || 5000;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

app.use(express.json());

app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "./tmp/"
}))

// Routes
app.use("/api/v1", topicsRouter);
app.use("/api/v1", tipsRouter);
app.use("/api/v1", postsRouter);

// Auth Routes
app.use("/api/auth", authRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});