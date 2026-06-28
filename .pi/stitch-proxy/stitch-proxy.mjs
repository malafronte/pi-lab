import http from "node:http";
import https from "node:https";

const STITCH_URL = "https://stitch.googleapis.com/mcp";
const PORT = 9020;

function stripRefs(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(stripRefs);
  if ("$ref" in obj) return {};
  const result = {};
  for (const key of Object.keys(obj)) {
    result[key] = stripRefs(obj[key]);
  }
  return result;
}

function fixToolSchemas(tools) {
  for (const tool of tools) {
    if (tool.inputSchema) {
      tool.inputSchema = stripRefs(tool.inputSchema);
    }
    if (tool.outputSchema) {
      tool.outputSchema = stripRefs(tool.outputSchema);
    }
  }
  return tools;
}

function forwardRequest(body, apiKey) {
  const url = new URL(STITCH_URL);
  return new Promise((resolve, reject) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (apiKey) {
      headers["X-Goog-Api-Key"] = apiKey;
    }
    const opts = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: "POST",
      headers,
    };
    const proxyReq = https.request(opts, (proxyRes) => {
      let data = "";
      proxyRes.on("data", (chunk) => (data += chunk));
      proxyRes.on("end", () => resolve({ status: proxyRes.statusCode, body: data }));
    });
    proxyReq.on("error", reject);
    proxyReq.write(body || "");
    proxyReq.end();
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (chunk) => (body += chunk));

  req.on("end", async () => {
    try {
      const apiKey = req.headers["x-goog-api-key"];
      const response = await forwardRequest(body, apiKey);
      let respBody = response.body;

      if (body) {
        try {
          const reqJson = JSON.parse(body);
          const respJson = JSON.parse(respBody);
          if (reqJson.method === "tools/list" && respJson.result?.tools) {
            respJson.result.tools = fixToolSchemas(respJson.result.tools);
            respBody = JSON.stringify(respJson);
          }
        } catch {}
      }

      res.writeHead(response.status, { "Content-Type": "application/json" });
      res.end(respBody);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Proxy error: " + err.message }));
    }
  });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Stitch MCP proxy running on http://127.0.0.1:${PORT}`);
});
