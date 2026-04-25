const asyncHandler = require("../utils/asyncHandler");
const paymentService = require("../services/payment.service");
const { env } = require("../config/env");

const getGatewayPayload = (req) => {
  if (req.body && Object.keys(req.body).length) {
    return req.body;
  }

  return req.query || {};
};

const createSslCommerzSession = asyncHandler(async (req, res) => {
  const session = await paymentService.createSslCommerzSession({
    orderId: req.params.orderId,
    userId: req.user.id,
  });

  res.status(200).json({
    success: true,
    message: "SSLCommerz session created",
    data: session,
  });
});

const redirectToSslCommerz = asyncHandler(async (req, res) => {
  const session = await paymentService.createSslCommerzSession({
    orderId: req.params.orderId,
    userId: req.user.id,
  });

  res.redirect(session.paymentUrl);
});

const renderGatewayResultRedirect = (resultType) => (_req, res) => {
  const redirectUrl = `${env.frontendBaseUrl}/checkout?payment=${resultType}`;
  res.redirect(redirectUrl);
};

const sslCommerzSuccess = asyncHandler(async (req, res) => {
  try {
    await paymentService.updateOrderAfterCallback({
      statusType: "success",
      payload: getGatewayPayload(req),
    });

    renderGatewayResultRedirect("success")(req, res);
  } catch (_error) {
    renderGatewayResultRedirect("fail")(req, res);
  }
});

const sslCommerzFail = asyncHandler(async (req, res) => {
  try {
    await paymentService.updateOrderAfterCallback({
      statusType: "fail",
      payload: getGatewayPayload(req),
    });
  } catch (_error) {
    // Do not expose callback processing errors to the gateway user.
  }

  renderGatewayResultRedirect("fail")(req, res);
});

const sslCommerzCancel = asyncHandler(async (req, res) => {
  try {
    await paymentService.updateOrderAfterCallback({
      statusType: "cancel",
      payload: getGatewayPayload(req),
    });
  } catch (_error) {
    // Do not expose callback processing errors to the gateway user.
  }

  renderGatewayResultRedirect("cancel")(req, res);
});

module.exports = {
  createSslCommerzSession,
  redirectToSslCommerz,
  sslCommerzSuccess,
  sslCommerzFail,
  sslCommerzCancel,
};
