import { serve } from "https://deno.land/std@0.201.0/http/server.ts";

// 从环境变量读取（可在 Deno Deploy Dashboard 配置）
const OWNER = Deno.env.get("GITHUB_OWNER") ?? "monbed";
const REPO = Deno.env.get("GITHUB_REPO") ?? "wife";
const BRANCH = Deno.env.get("GITHUB_BRANCH") ?? "main";
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";

// 主处理函数
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // 去掉前导 "/"
  const path = url.pathname.replace(/^\/+/, "");

  // 1. 列表接口："/" 或 "/list"
  if (path === "" || path === "list") {
    const apiUrl = `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`;
    const headers: Record<string,string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Mozilla/5.0 (Windows NT 6.1; Trident/7.0; rv:11.0) like Gecko",
    };
    if (GITHUB_TOKEN) {
      // GitHub 推荐用 Bearer 也支持 token 前缀
      headers["Authorization"] = `Bearer ${GITHUB_TOKEN}`;
    }
    const resp = await fetch(apiUrl, { headers, 
      // 可配置超时，比如 5s
      signal: AbortSignal.timeout(5000),
    });
    if (!resp.ok) {
      return new Response(`列表获取失败: ${resp.status} ${resp.statusText}`, {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }
    const { tree } = await resp.json() as { tree: Array<{path:string,type:string}> };
    // 只保留 blob 且前缀是 img1/ 或 img2/
    const names = tree
      .filter((e) => e.type === "blob")
      .filter((e) => e.path.startsWith("img1/") || e.path.startsWith("img2/"))
      .map((e) => e.path.replace(/^img[12]\//, ""));
    return new Response(names.join("\n"), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // 2. 图片代理：依次尝试 img1/ 和 img2/
  const rawBase = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/`;
  const tryUrls = [
    rawBase + "img1/" + encodeURIComponent(path),
    rawBase + "img2/" + encodeURIComponent(path),
  ];
  for (const u of tryUrls) {
    // 加上超时 & 重试逻辑
    try {
      const imgResp = await fetch(u, {
        method: "GET",
        signal: AbortSignal.timeout(7000),
      });
      if (imgResp.ok && imgResp.body) {
        // 保留原始 Content-Type（支持 png/jpg/webp/svg/…任意格式）
        const contentType = imgResp.headers.get("content-type") ?? "application/octet-stream";
        return new Response(imgResp.body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            // 缓存一天，可根据需求调整
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=3600",
          },
        });
      }
    } catch (_e) {
      // 超时或网络错误，尝试下一个 URL
    }
  }

  // 都没命中
  return new Response("未找到该图片", { status: 404 });
}

// 启动服务
serve(handleRequest);
