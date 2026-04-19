exports.handler = async function (event) {
  try {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return {
        statusCode: 500,
        body: "Missing FRONTEND_URL environment variable."
      };
    }

    const orderTrackingId =
      event.queryStringParameters?.OrderTrackingId ||
      event.queryStringParameters?.orderTrackingId ||
      "";

    const merchantReference =
      event.queryStringParameters?.OrderMerchantReference ||
      event.queryStringParameters?.orderMerchantReference ||
      "";

    const redirectUrl =
      `${frontendUrl}?payment=returned` +
      `&orderTrackingId=${encodeURIComponent(orderTrackingId)}` +
      `&merchantReference=${encodeURIComponent(merchantReference)}`;

    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl
      }
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Callback redirect failed: ${error.message}`
    };
  }
};
