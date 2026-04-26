const DEFAULT_FRAPPE_BASE_URL = "https://gt.digigalaxy.cloud";

function toQueryString(query, excludeKey) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query || {})) {
    if (key === excludeKey || value == null) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry != null) {
          params.append(key, String(entry));
        }
      }
      continue;
    }

    params.append(key, String(value));
  }

  const result = params.toString();
  return result ? `?${result}` : "";
}

function toRequestBody(method, rawBody) {
  if (method === "GET" || method === "HEAD") {
    return undefined;
  }

  if (rawBody == null) {
    return undefined;
  }

  if (typeof rawBody === "string" || rawBody instanceof Uint8Array) {
    return rawBody;
  }

  return JSON.stringify(rawBody);
}

export default async function handler(req, res) {
  const requestMethod = String(req.method || "GET").toUpperCase();
  const requestOrigin = String(req.headers?.origin || "");

  if (requestMethod === "OPTIONS") {
    if (requestOrigin) {
      res.setHeader("Access-Control-Allow-Origin", requestOrigin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      String(req.headers?.["access-control-request-headers"] || "content-type,authorization"),
    );
    return res.status(204).end();
  }

  const baseUrl = (process.env.FRAPPE_BASE_URL || process.env.VITE_FRAPPE_URL || DEFAULT_FRAPPE_BASE_URL).replace(
    /\/+$/,
    "",
  );

  const apiKey = process.env.FRAPPE_API_KEY;
  const apiSecret = process.env.FRAPPE_API_SECRET;
  const hasTokenAuth = Boolean(apiKey && apiSecret);

  const pathParts = req.query?.path;
  const path = Array.isArray(pathParts) ? pathParts.join("/") : String(pathParts || "");
  const query = toQueryString(req.query || {}, "path");
  const upstreamUrl = `${baseUrl}/api/${path}${query}`;
  const isLoginPath = path === "method/login";

  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Accept", String(req.headers?.accept || "application/json"));

  if (req.headers?.["content-type"]) {
    upstreamHeaders.set("Content-Type", String(req.headers["content-type"]));
  }

  if (hasTokenAuth && !isLoginPath) {
    upstreamHeaders.set("Authorization", `token ${apiKey}:${apiSecret}`);
  } else if (req.headers?.cookie) {
    upstreamHeaders.set("Cookie", String(req.headers.cookie));
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: requestMethod,
      headers: upstreamHeaders,
      body: toRequestBody(requestMethod, req.body),
      redirect: "manual",
    });

    res.status(upstream.status);

    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    const setCookieMany = upstream.headers.getSetCookie?.();
    if (Array.isArray(setCookieMany) && setCookieMany.length) {
      res.setHeader("set-cookie", setCookieMany);
    } else {
      const singleSetCookie = upstream.headers.get("set-cookie");
      if (singleSetCookie) {
        res.setHeader("set-cookie", singleSetCookie);
      }
    }

    const bodyBuffer = Buffer.from(await upstream.arrayBuffer());
    res.send(bodyBuffer);
  } catch (caught) {
    const message = caught && caught.message ? caught.message : "Proxy request failed";
    res.status(502).json({
      message,
      proxy: "goods-transport-web/api/frappe/[...path]",
      upstream: baseUrl,
    });
  }
}