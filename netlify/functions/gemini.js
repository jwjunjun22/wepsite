const https = require("https");

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: "API 키 없음" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const model = body.model || "gemini-2.5-flash";
    const version = body.version || "v1beta";
    const payload = JSON.stringify(body.payload);

    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    const data = await new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload)
        }
      }, (res) => {
        let raw = "";
        res.on("data", chunk => raw += chunk);
        res.on("end", () => {
          try { resolve(JSON.parse(raw)); }
          catch(e) { reject(new Error("JSON 파싱 실패: " + raw.slice(0, 100))); }
        });
      });
      req.on("error", reject);
      req.write(payload);
      req.end();
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(data)
    };
  } catch(e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message })
    };
  }
};
