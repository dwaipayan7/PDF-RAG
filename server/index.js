import express from "express";
import cors from "cors";
import multer from "multer";
import { Queue } from "bullmq";
import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text-v2-moe",
  baseUrl: "http://localhost:11434",
});

const queue = new Queue("file-upload-queue", {
  connection: {
    host: "localhost",
    port: "6379",
  },
});

const storage = multer.diskStorage({
  destination: function (req, res, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix} - ${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// const queue = new Queue("file-upload-queue", {
//   connection: {
//     host: "localhost",
//     port: 6379,
//   },
// });

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  return res.json({ Hello: "This is Dwaipayan" });
});

app.post("/upload/pdf", upload.single("pdf"), async (req, res) => {
  await queue.add(
    "file-ready",
    JSON.stringify({
      filename: req.file.originalname,
      destination: req.file.destination,
      path: req.file.path,
    }),
  );

  return res.json({ message: "uploaded" });
});

app.listen(8000, () => {
  console.log(`Server started on PORT:${8000}`);
});
