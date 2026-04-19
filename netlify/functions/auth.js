exports.handler = async function () {
  try {
    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    const baseUrl = process.env.PESAPAL_BASE_URL;

    if (!consumerKey || !consumerSecret || !baseUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Missing required environment variables."
        })
      };
    }

    const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        consumer_key: consumerKey,
        consumer_secret: consumerSecret
      })
    });

    const data = await response.json();

    return {
      statusCode: response.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Authentication request failed.",
        details: error.message
      })
    };
  }
};
