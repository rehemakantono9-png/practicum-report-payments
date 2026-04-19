exports.handler = async function (event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Method not allowed. Use POST."
        })
      };
    }

    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    const baseUrl = process.env.PESAPAL_BASE_URL;
    const backendUrl = process.env.BACKEND_URL;
    const frontendUrl = process.env.FRONTEND_URL;

    if (!consumerKey || !consumerSecret || !baseUrl || !backendUrl || !frontendUrl) {
      return {
        statusCode: 500,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Missing required environment variables."
        })
      };
    }

    const {
      amount,
      email,
      phone_number,
      first_name,
      last_name,
      project_name,
      merchant_reference,
      notification_id
    } = JSON.parse(event.body || "{}");

    if (!amount || !email || !merchant_reference || !notification_id) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Missing required payment fields."
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
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          error: "Failed to get auth token.",
          details: authData
        })
      };
    }

    const callbackUrl = `${backendUrl}/.netlify/functions/callback`;

    const orderPayload = {
      id: merchant_reference,
      currency: "UGX",
      amount: Number(amount),
      description: `Payment for ${project_name || "Practicum Report Builder Premium"}`,
      callback_url: callbackUrl,
      notification_id: notification_id,
      billing_address: {
        email_address: email,
        phone_number: phone_number || "",
        country_code: "UG",
        first_name: first_name || "Student",
        middle_name: "",
        last_name: last_name || "User",
        line_1: "N/A",
        line_2: "",
        city: "Kampala",
        state: "UG",
        postal_code: "00000",
        zip_code: "00000"
      }
    };

    const orderResponse = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authData.token}`
      },
      body: JSON.stringify(orderPayload)
    });

    const orderData = await orderResponse.json();

    return {
      statusCode: orderResponse.status,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        error: "Submit order failed.",
        details: error.message
      })
    };
  }
};
