const SANDBOX = "https://cybqa.pesapal.com/pesapalv3/api";
const LIVE = "https://pay.pesapal.com/v3/api";

// REMMIE KOMM HUB - MASTER BRAND
const BRAND_NAME = "Remmie Komm Hub";

async function getToken(base) {
    const r = await fetch(`${base}/Auth/RequestToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
            consumer_key: process.env.PESAPAL_CONSUMER_KEY,
            consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
        })
    });
    return r.json();
}

exports.handler = async (event) => {
    try {
        if (event.httpMethod !== "POST") {
            return { statusCode: 405, body: "Method not allowed" };
        }

        const env = process.env.PESAPAL_ENV || "SANDBOX";
        const base = env === "LIVE" ? LIVE : SANDBOX;

        const { amount, email, name, productType, productName } = JSON.parse(event.body || "{}");

        // Determine product description based on type
        let productDisplayName = "";
        let productDescription = "";

        switch (productType) {
            case "cv":
                productDisplayName = `${BRAND_NAME} - CV Builder`;
                productDescription = "Professional CV Builder - Complete CV with AI suggestions";
                break;
            case "internship":
                productDisplayName = `${BRAND_NAME} - Internship Report Builder`;
                productDescription = "Internship Report Builder - Complete report with logbook to report generation";
                break;
            case "coverletter":
                productDisplayName = `${BRAND_NAME} - Cover Letter Generator`;
                productDescription = "Professional Cover Letter Generator - AI-powered";
                break;
            default:
                productDisplayName = `${BRAND_NAME} - Digital Product`;
                productDescription = productName || "Professional Digital Product";
        }

        const tokenRes = await getToken(base);
        const token = tokenRes.token;

        const payload = {
            id: productType + "_" + Date.now(),
            currency: "UGX",
            amount: Number(amount),
            description: productDisplayName,
            callback_url: process.env.PESAPAL_CALLBACK_URL,
            notification_id: process.env.PESAPAL_IPN_ID,
            billing_address: {
                email_address: email,
                first_name: name.split(" ")[0] || name,
                last_name: name.split(" ").slice(1).join(" ") || "",
                country_code: "UG"
            }
        };

        const r = await fetch(`${base}/Transactions/SubmitOrderRequest`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const resData = await r.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                ok: true, 
                redirect_url: resData.redirect_url,
                product: productDisplayName
            })
        };
    } catch (error) {
        console.error("Payment error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ ok: false, error: "Submit order failed" })
        };
    }
};
