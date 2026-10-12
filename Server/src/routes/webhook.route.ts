import express, { Router } from "express";
import { razorpayWebhookController } from "../controllers/webhook.controller.js";

const router: Router = Router();

// no login: Razorpay proves who it is with the X-Razorpay-Signature header instead
router.post("/razorpay", express.raw({ type: "application/json" }), razorpayWebhookController);

export default router;
