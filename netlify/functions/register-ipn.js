exports.handler = async function () {
  try {
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    const baseUrl = process.env.PESAPAL_BASE_URL;
    const backendUrl = process.env.BACKEND_URL;

    if (!consumerKey || !consumerSecret || !baseUrl || !backendUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing required environment variables."
        })
      };
    }

    const authResponse = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    });

    const authData = await authResponse.json();

    if (!authData.token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Failed to get auth token.",
          details: authData
        })
      };
    }

    const ipnUrl = `${backendUrl}/.netlify/functions/ipn`;

    const ipnResponse = await fetch(`${baseUrl}/api/URLSetup/RegisterIPN`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: "GET"
      })
    });

    const ipnData = await ipnResponse.json();

    return {
      statusCode: ipnResponse.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(ipnData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "IPN registration failed.",
        details: error.message
      })
    };
  }
};
