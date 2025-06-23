import express, { type Application } from "express"
import cors from "cors"
import helmet from "helmet"
import dotenv from "dotenv"
import path from "path"

// Routes
import authRoutes from "./routes/auth"
import userRoutes from "./routes/user"
import campaignRoutes from "./routes/campaign"
import donationRoutes from "./routes/donation"
import communityRoutes from "./routes/community"
import adminRoutes from "./routes/admin"
import statsRoutes from "./routes/stats"

// Middleware
import { errorHandler } from "./middleware/errorHandler"

dotenv.config()

const app: Application = express()

// FIX: Disable X-Powered-By first
app.disable("x-powered-by")

// FIX: CORS before everything else
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
  }),
)

// FIX: Body parsing BEFORE any other middleware
app.use(
  express.json({
    limit: "50mb",
    type: ["application/json", "text/plain"],
  }),
)

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  }),
)

// FIX: Simple body check middleware
app.use((req, res, next) => {
  if (req.method === "PUT" || req.method === "POST") {
    console.log(`\n=== ${req.method} ${req.path} ===`)
    console.log("Content-Type:", req.headers["content-type"])
    console.log("Body exists:", !!req.body)
    console.log("Body:", req.body)
    console.log("========================\n")
  }
  next()
})

// Security middleware AFTER body parsing
app.use(helmet())

// Static files
const uploadsPath = path.join(__dirname, "../uploads")
console.log('Static files path:', uploadsPath)
app.use("/uploads", express.static(uploadsPath))

// API Routes
app.use("/api/auth", authRoutes)
app.use("/api/v1/user", userRoutes)
app.use("/api/campaigns", campaignRoutes)
app.use("/api/donations", donationRoutes)
app.use("/api/v1/community", communityRoutes)
app.use("/api/v1/admin", adminRoutes)
app.use("/api/v1/stats", statsRoutes)

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Cat Donation API is running",
    timestamp: new Date().toISOString(),
  })
})

// Error handling
app.use(errorHandler)

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
    method: req.method,
  })
})

export default app
