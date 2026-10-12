import type { Request, Response } from "express";
import { mockGatewayPayService } from "../services/payment.service.js";
import { sendOk } from "../utils/api_response.js";
import type { MockPaymentType } from "../dto/payment.dto.js";
import { badRequest } from "../utils/api-error.js";

const mockGatewayPayController = async (req: Request, res: Response) => {
  const { gatewayOrderId } = req.params;
  // validated by mockPaymentDTO
  const { outcome }: MockPaymentType = req.body;

  if (!gatewayOrderId || typeof gatewayOrderId !== "string") {
    throw badRequest("Gateway order ID is required");
  }

  const result = mockGatewayPayService(gatewayOrderId, outcome);
  return sendOk(res, "Payment successful", result);
};

export { mockGatewayPayController };
