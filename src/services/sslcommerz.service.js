const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");

const getSslCommerzBaseUrls = () => {
  if (env.sslcommerzInitUrl && env.sslcommerzValidationUrl) {
    return {
      initUrl: env.sslcommerzInitUrl,
      validationUrl: env.sslcommerzValidationUrl,
    };
  }

  if (env.sslcommerzIsLive) {
    return {
      initUrl: "https://securepay.sslcommerz.com/gwprocess/v4/api.php",
      validationUrl:
        "https://securepay.sslcommerz.com/validator/api/validationserverAPI.php",
    };
  }

  return {
    initUrl: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
    validationUrl:
      "https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php",
  };
};

const assertConfigured = () => {
  if (!env.sslcommerzStoreId || !env.sslcommerzStorePassword) {
    throw new ApiError(
      500,
      "SSLCommerz is not configured. Set SSLCOMMERZ_STORE_ID and SSLCOMMERZ_STORE_PASSWORD",
    );
  }
};

const createSession = async ({ payload }) => {
  assertConfigured();

  const { initUrl } = getSslCommerzBaseUrls();

  const response = await fetch(initUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new ApiError(502, "Failed to create SSLCommerz session");
  }

  const data = await response.json();

  if (!data || data.status !== "SUCCESS" || !data.GatewayPageURL) {
    throw new ApiError(
      502,
      data?.failedreason || "SSLCommerz session initialization failed",
    );
  }

  return data;
};

const validateTransaction = async ({ validationId }) => {
  assertConfigured();

  const { validationUrl } = getSslCommerzBaseUrls();
  const url = new URL(validationUrl);
  url.searchParams.set("val_id", validationId);
  url.searchParams.set("store_id", env.sslcommerzStoreId);
  url.searchParams.set("store_passwd", env.sslcommerzStorePassword);
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), { method: "GET" });

  if (!response.ok) {
    throw new ApiError(502, "Failed to validate SSLCommerz transaction");
  }

  return response.json();
};

module.exports = {
  createSession,
  validateTransaction,
};
