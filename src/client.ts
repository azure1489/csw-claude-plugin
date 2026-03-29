// CswClient — HTTP client for all MCP tools to call the CSW backend API
// 所有 MCP 工具调用 CSW 后端 API 的 HTTP 客户端

export class CswApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "CswApiError";
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>;

export class CswClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.CSW_API_KEY;
    const apiUrl = process.env.CSW_API_URL;

    if (!apiKey) {
      throw new Error("CSW_API_KEY 环境变量未设置 (CSW_API_KEY environment variable is not set)");
    }
    if (!apiUrl) {
      throw new Error("CSW_API_URL 环境变量未设置 (CSW_API_URL environment variable is not set)");
    }

    this.apiKey = apiKey;
    // Strip trailing slash before appending /api
    this.baseUrl = apiUrl.replace(/\/$/, "") + "/api";
  }

  private get headers(): Record<string, string> {
    return {
      "Authorization": `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const url = this.baseUrl + path;
    if (!params) return url;

    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    }
    const qs = searchParams.toString();
    return qs ? `${url}?${qs}` : url;
  }

  private async handleResponse(response: Response): Promise<unknown> {
    if (response.ok) {
      if (response.status === 204) return {};
      const text = await response.text();
      if (!text) return {};
      return JSON.parse(text);
    }

    if (response.status === 401) {
      throw new CswApiError(401, "API key 无效或已过期");
    }
    if (response.status === 404) {
      throw new CswApiError(404, "资源不存在");
    }
    if (response.status === 422) {
      let detail = "请求参数错误";
      try {
        const body = (await response.json()) as { detail?: string };
        if (body.detail) detail = body.detail;
      } catch {
        // ignore JSON parse failure
      }
      throw new CswApiError(422, detail);
    }
    if (response.status >= 500) {
      throw new CswApiError(response.status, "服务端错误，请稍后重试");
    }

    throw new CswApiError(response.status, `请求失败: ${response.status}`);
  }

  async get(path: string, params?: QueryParams): Promise<unknown> {
    const response = await fetch(this.buildUrl(path, params), {
      method: "GET",
      headers: this.headers,
    });
    return this.handleResponse(response);
  }

  async post(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(this.buildUrl(path), {
      method: "POST",
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async put(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(this.buildUrl(path), {
      method: "PUT",
      headers: this.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    return this.handleResponse(response);
  }

  async del(path: string): Promise<unknown> {
    const response = await fetch(this.buildUrl(path), {
      method: "DELETE",
      headers: this.headers,
    });
    return this.handleResponse(response);
  }
}
