import type { Request, Response } from "express";
import { createOrderService, getAllOrdersByUserIdService, getOrderDetailsByIdService, verifyPaymentService} from "../services/order.service.js";
import { sendCreated, sendOk } from "../utils/api_response.js";
import type { CreateOrderType } from "../dto/order.dto.js";
import { badRequest } from "../utils/api-error.js";
import { getPagination } from "../utils/query.js";
import {type VerifyPaymentType} from "../dto/payment.dto.js";

const createOrderServiceController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  // validated by createOrderDTO
  const { shippingAddress, paymentMethod }: CreateOrderType = req.body;

  const result = await createOrderService({ userId, shippingAddress, paymentMethod });

    const message = result.payment
      ? "Order created, waiting for payment"
      : "Order placed successfully";
    return sendCreated(res, message, result);

};

const getAllOrdersByUserIdController = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    // limit 1–50 (default 10), offset ≥ 0 (default 0); missing/invalid values fall back to the defaults
    const { offset, limit } = getPagination(req.query);

    const result = await getAllOrdersByUserIdService(userId, offset, limit);
    return sendOk(res, "Orders fetched successfully", result);
}

const getOrderDetailsByIdController = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { orderId } = req.params;

    if (!orderId || typeof orderId !== "string") {
        throw badRequest("Order ID is required");
    }

    const result = await getOrderDetailsByIdService(userId, orderId);
    return sendOk(res, "Order details fetched successfully", result);
}

const verifyPaymentController = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { orderId }= req.params;
  // validated by verifyPaymentDTO
  const { gatewayPaymentId, signature }: VerifyPaymentType = req.body;

  if(!orderId || typeof orderId !== "string") {
    throw badRequest("Order ID is required");
}

  const order = await verifyPaymentService({
    userId,
    orderId,
    gatewayPaymentId,
    signature,
  });
  return sendOk(res, "Payment successful, order confirmed", order);
};


export {
  createOrderServiceController,
  getAllOrdersByUserIdController,
  getOrderDetailsByIdController,
  verifyPaymentController,
};
