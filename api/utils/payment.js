const crypto = require("crypto");
const axios = require("axios");

const { ACCESSKEY, SECRETKEY, REDIRECTURL, IPNURL } = process.env;
if (!ACCESSKEY || !SECRETKEY || !REDIRECTURL || !IPNURL) {
  throw new Error(
    "Missing required environment variables: ACCESSKEY, SECRETKEY, REDIRECTURL, IPNURL"
  );
}

const defaultParams = {
  accessKey: ACCESSKEY,
  secretKey: SECRETKEY,
  orderInfo: "pay with MoMo",
  partnerCode: "MOMO",
  redirectUrl: REDIRECTURL,
  ipnUrl: IPNURL,
  requestType: "payWithMethod",
  extraData: "",
  orderGroupId: "",
  autoCapture: true,
  lang: "vi",
};

const createRawSignature = (orderId, amount, requestId) => {
  return `accessKey=${defaultParams.accessKey}&amount=${amount}&extraData=${defaultParams.extraData}&ipnUrl=${defaultParams.ipnUrl}&orderId=${orderId}&orderInfo=${defaultParams.orderInfo}&partnerCode=${defaultParams.partnerCode}&redirectUrl=${defaultParams.redirectUrl}&requestId=${requestId}&requestType=${defaultParams.requestType}`;
};

const createRawSignature2 = (orderId) => {
  return `accessKey=${defaultParams.accessKey}&orderId=${orderId}&partnerCode=${defaultParams.partnerCode}&requestId=${orderId}`;
};

const generateSignature = (rawSignature) => {
  return crypto
    .createHmac("sha256", defaultParams.secretKey)
    .update(rawSignature)
    .digest("hex");
};

const createRawData = (orderId, amount) => {
  const requestId = orderId;

  return {
    amount,
    orderId,
    requestId,
    signature: generateSignature(
      createRawSignature(orderId, amount, requestId)
    ),
  };
};

const createPayment = async (orderId, amount) => {
  const rawData = createRawData(orderId, amount);
  const requestBody = { ...defaultParams, ...rawData };
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(requestBody)),
    },
    data: requestBody,
  };

  try {
    const response = await axios(options);
    console.log("💬 MoMo response:", response.data);
    if (response.status === 200) {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "Error occurred while sending payment request:",
      error.message || error
    );
    throw new Error(`Payment request failed: ${error.message || error}`);
  }
};

//check transaction status
const getPaymented = async (orderId) => {
  const requestBody = {
    partnerCode: "MOMO",
    requestId: orderId,
    orderId: orderId,
    lang: "vi",
    signature: generateSignature(createRawSignature2(orderId)),
  };
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/query",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(JSON.stringify(requestBody)),
    },
    data: requestBody,
  };

  try {
    const response = await axios(options);
    if (response.status === 200) {
      return response.data;
    } else {
      return null;
    }
  } catch (error) {
    console.error(
      "Error occurred while sending payment request:",
      error.message || error
    );
    throw new Error(`Payment request failed: ${error.message || error}`);
  }
};

module.exports = {
  createPayment,
  getPaymented,
};
