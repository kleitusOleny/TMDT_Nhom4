import crypto from "crypto";

interface BuildPaymentUrlParams {
  amount: number;
  orderInfo: string;
  orderId: string;
  ipAddr: string;
  returnUrl?: string;
}

function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function stringifyParams(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  const pairs: string[] = [];
  for (const key of sortedKeys) {
    const val = params[key];
    if (val !== undefined && val !== null && val !== "") {
      pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(val).replace(/%20/g, "+")}`);
    }
  }
  return pairs.join("&");
}

export function createVnpayPaymentUrl(params: BuildPaymentUrlParams): string {
  const tmnCode = process.env.VNP_TMN_CODE || "CLEANMAT";
  const secretKey = process.env.VNP_HASH_SECRET || "CLEANMATESECRETKEY2026VN";
  const vnpUrl = process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
  const defaultReturnUrl = process.env.VNP_RETURN_URL || "http://localhost:3000/api/payment/vnpay-return";

  const date = new Date();
  const createDate = formatDate(date);

  // VNPay tính theo đơn vị VND * 100
  const vnpAmount = Math.round(params.amount * 100);

  const vnp_Params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Locale: "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: params.orderId,
    vnp_OrderInfo: params.orderInfo.substring(0, 255),
    vnp_OrderType: "other",
    vnp_Amount: vnpAmount.toString(),
    vnp_ReturnUrl: params.returnUrl || defaultReturnUrl,
    vnp_IpAddr: params.ipAddr || "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  const signData = stringifyParams(vnp_Params);
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  vnp_Params["vnp_SecureHash"] = signed;
  return `${vnpUrl}?${stringifyParams(vnp_Params)}`;
}

export function verifyVnpaySignature(query: Record<string, string>): { isValid: boolean; responseCode: string; txnRef: string } {
  const secretKey = process.env.VNP_HASH_SECRET || "CLEANMATESECRETKEY2026VN";
  const secureHash = query["vnp_SecureHash"];
  const responseCode = query["vnp_ResponseCode"] || "";
  const txnRef = query["vnp_TxnRef"] || "";

  const cleanQuery: Record<string, string> = {};
  for (const key of Object.keys(query)) {
    if (key !== "vnp_SecureHash" && key !== "vnp_SecureHashType") {
      cleanQuery[key] = query[key];
    }
  }

  const signData = stringifyParams(cleanQuery);
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  const isValid = secureHash ? secureHash.toLowerCase() === signed.toLowerCase() : false;
  return { isValid, responseCode, txnRef };
}
