import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CswClient, CswApiError } from "../src/client.js";

// Helper to create a mock Response
function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe("CswClient constructor", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws if CSW_API_KEY is missing", () => {
    delete process.env.CSW_API_KEY;
    process.env.CSW_API_URL = "https://example.com";
    expect(() => new CswClient()).toThrow(/CSW_API_KEY/);
  });

  it("throws if CSW_API_URL is missing", () => {
    process.env.CSW_API_KEY = "test-key";
    delete process.env.CSW_API_URL;
    expect(() => new CswClient()).toThrow(/CSW_API_URL/);
  });
});

describe("CswClient requests", () => {
  const originalEnv = process.env;
  let client: CswClient;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.CSW_API_KEY = "test-key-123";
    process.env.CSW_API_URL = "https://example.com";
    client = new CswClient();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("GET sends query params and Bearer auth header correctly", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse(200, { data: "ok" }));

    await client.get("/posts", { page: 1, active: true, name: "foo" });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://example.com/api/posts?page=1&active=true&name=foo");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-key-123"
    );
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json"
    );
    expect(init.method).toBe("GET");
  });

  it("POST sends JSON body correctly", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse(200, { id: 42 }));

    const result = await client.post("/articles", { title: "Hello", draft: false });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(url).toBe("https://example.com/api/articles");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ title: "Hello", draft: false }));
    expect(result).toEqual({ id: 42 });
  });

  it("maps 401 to descriptive error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(401, {}));

    await expect(client.get("/protected")).rejects.toMatchObject({
      status: 401,
      message: "API key 无效或已过期",
    });
  });

  it("maps 404 to descriptive error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(404, {}));

    await expect(client.get("/missing")).rejects.toMatchObject({
      status: 404,
      message: "资源不存在",
    });
  });

  it("maps 5xx to descriptive error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(mockResponse(503, {}));

    await expect(client.get("/broken")).rejects.toMatchObject({
      status: 503,
      message: "服务端错误，请稍后重试",
    });
  });

  it("strips undefined query params", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(mockResponse(200, {}));

    await client.get("/posts", { page: 1, tag: undefined, active: true });

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/api/posts?page=1&active=true");
    expect(url).not.toContain("tag");
  });
});
