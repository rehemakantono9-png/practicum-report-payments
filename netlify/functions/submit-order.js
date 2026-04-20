const corsHeaders = {
  "Access-Control-Allow-Origin": "https://rehemakantono9-png.github.io",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

exports.handler = async function (event) {
  try {
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: ""
      };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Method not allowed. Use POST."
        })
      };
    }

    const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
    const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
    const baseUrl = process.env.PESAPAL_BASE_URL;
    const backendUrl = process.env.BACKEND_URL;

    if (!consumerKey || !consumerSecret || !baseUrl || !backendUrl) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Missing required environment variables."
        })
      };
    }

    const body = JSON.parse(event.body || "{}");

    const amount = parseFloat(body.amount);
    const email = body.email;
    const phoneNumber = body.phone_number || "";
    const firstName = body.first_name || "Student";
    const lastName = body.last_name || "User";
    const projectName = body.project_name || "Practicum Report Builder Premium";
    const merchantReference = body.merchant_reference;
    const notificationId = body.notification_id;

    if (!amount || !email || !merchantReference || !notificationId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
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
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Failed to get auth token.",
          details: authData
        })
      };
    }

    const callbackUrl = `${backendUrl}/.netlify/functions/callback`;

    const orderPayload = {
      id: merchantReference,
      currency: "UGX",
      amount: amount,
      description: `Payment for ${projectName}`,
      callback_url: callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: email,
        phone_number: phoneNumber,
        country_code: "UG",
        first_name: firstName,
        middle_name: "",
        last_name: lastName,
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
      headers: corsHeaders,
      body: JSON.stringify(orderData)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Submit order failed.",
        details: error.message
      })
    };
  }
};
