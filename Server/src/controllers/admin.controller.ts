import type { Request, Response } from "express";
import { getUsersService, getUserOrdersService, updateOrderService } from "../services/admin.service.js";
import { sendOk } from "../utils/api_response.js";
import { badRequest } from "../utils/api-error.js";
import { getPagination } from "../utils/query.js";
import type { UpdateOrderType } from "../dto/admin.dto.js";

const getUsersController = async (req: Request, res: Response) => {
  const { offset, limit } = getPagination(req.query);
  // ?search=x&search=y arrives as an array → ignored
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";

  const result = await getUsersService(search, offset, limit);
  return sendOk(res, "Users fetched successfully", result);
};

const getUserOrdersController = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { offset, limit } = getPagination(req.query);

  if (!userId || typeof userId !== "string") {
    throw badRequest("User ID is required");
  }

  const result = await getUserOrdersService(userId, offset, limit);
  return sendOk(res, "Orders fetched successfully", result);
};

const updateOrderController = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  // validated by updateOrderDTO
  const changes: UpdateOrderType = req.body;

  if (!orderId || typeof orderId !== "string") {
    throw badRequest("Order ID is required");
  }

  const order = await updateOrderService(orderId, changes);
  return sendOk(res, "Order updated", order);
};

export { getUsersController, getUserOrdersController, updateOrderController };
