import express, { Express, Request, Response } from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import dashboardRoutes from "./routes/dashboard.route.js";
import productRoutes from "./routes/product.route.js";
import wishlistRoutes from './routes/wishlist.route.js'
import cartRoutes from './routes/cart.route.js'
import orderRoutes from './routes/order.route.js'
import paymentRoutes from "./routes/payment.route.js";
import webhookRoutes from "./routes/webhook.route.js";
import adminRoutes from "./routes/admin.route.js";
import productAdminRoutes from "./routes/productAdmin.route.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";


const app: Express = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);
// before express.json(): webhooks need the raw body to check their signature
app.use("/api/webhooks", webhookRoutes);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req: Request, res: Response) => {
  res.send("Server is healthy");
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes); 
app.use("/api/dashboard/product", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", productAdminRoutes);
// fake payment gateway — anyone could "pay" with it, so it never exists in production
if (process.env.mode !== "production") {
  app.use("/api/payments", paymentRoutes);
}


// must come after all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
