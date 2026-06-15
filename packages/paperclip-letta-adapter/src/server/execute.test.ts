import { afterEach, describe, expect, it } from "bun:test";
import type { AdapterExecutionContext } from "../contract.js";
import { execute } from "./execute.js";
import { parseModels, parseTurn, resolveAuthHeaders } from "./letta-client.js";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function makeCtx(overrides: Partial<AdapterExecutionContext> = {}): AdapterExecutionContext {
  const logs: Array<[string, string]> = [];
  return {
    runId: "run-1",
    agent: { id: "agent-otto", companyId: "co-1", name: "otto", adapterType: "letta_local", adapterConfig: {} },
    runtime: { sessionId: null, sessionParams: null, sessionDisplayId: null, taskKey: null },
    config: { agentId: "agent-letta-123", baseUrl: "http://127.0.0.1:8283" },
    context: { taskTitle: "Do the thing", taskBody: "Details here" },
    onLog: async (stream, chunk) => {
      logs.push([stream, chunk]);
    },
    ...overrides,
  };
}

describe("parseTurn", () => {
  it("reads assistant text and usage from an array response", () => {
    const turn = parseTurn([
      { message_type: "reasoning_message", content: "thinking..." },
      { message_type: "assistant_message", content: "Done." },
      { message_type: "usage_statistics", prompt_tokens: 12, completion_tokens: 34 },
    ]);
    expect(turn.assistantText).toBe("Done.");
    expect(turn.reasoningText).toBe("thinking...");
    expect(turn.usage).toEqual({ inputTokens: 12, outputTokens: 34 });
  });

  it("reads usage from a { messages, usage } response and array content", () => {
    const turn = parseTurn({
      messages: [{ message_type: "assistant_message", content: [{ type: "text", text: "Hi " }, { type: "text", text: "there" }] }],
      usage: { prompt_tokens: 5, completion_tokens: 7 },
    });
    expect(turn.assistantText).toBe("Hi there");
    expect(turn.usage).toEqual({ inputTokens: 5, outputTokens: 7 });
  });
});

describe("parseModels", () => {
  it("dedupes and labels model rows", () => {
    const models = parseModels({ data: [{ handle: "letta/auto", display_name: "Auto" }, { handle: "letta/auto" }] });
    expect(models).toEqual([{ id: "letta/auto", label: "Auto" }]);
  });
});

describe("resolveAuthHeaders", () => {
  it("builds Cloudflare Access headers and merges extra headers", () => {
    const headers = resolveAuthHeaders({
      cfAccessClientId: "id.access",
      cfAccessClientSecret: "secret",
      headers: { "X-Gateway": "edge" },
    });
    expect(headers).toEqual({
      "CF-Access-Client-Id": "id.access",
      "CF-Access-Client-Secret": "secret",
      "X-Gateway": "edge",
    });
  });

  it("returns no Access headers when only one half is present", () => {
    expect(resolveAuthHeaders({ cfAccessClientId: "id.access" })).toEqual({});
  });
});

describe("execute", () => {
  it("sends Cloudflare Access headers when configured", async () => {
    let sentHeaders: Record<string, string> = {};
    globalThis.fetch = (async (_url: string, init?: { headers?: Record<string, string> }) => {
      sentHeaders = init?.headers ?? {};
      return new Response(JSON.stringify({ messages: [{ message_type: "assistant_message", content: "ok" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as unknown as typeof fetch;

    await execute(
      makeCtx({
        config: {
          agentId: "agent-letta-123",
          baseUrl: "https://letta.example.com",
          cfAccessClientId: "id.access",
          cfAccessClientSecret: "secret",
        },
      }),
    );
    expect(sentHeaders["CF-Access-Client-Id"]).toBe("id.access");
    expect(sentHeaders["CF-Access-Client-Secret"]).toBe("secret");
  });

  it("fails fast without an agent id", async () => {
    const ctx = makeCtx({ config: { baseUrl: "http://127.0.0.1:8283" } });
    const result = await execute(ctx);
    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("agent id");
  });

  it("sends the run to the existing agent and returns summary + usage + session", async () => {
    let captured: { url: string; body: unknown } | null = null;
    globalThis.fetch = (async (url: string, init?: { body?: string }) => {
      captured = { url, body: init?.body ? JSON.parse(init.body) : null };
      return new Response(
        JSON.stringify({
          messages: [{ message_type: "assistant_message", content: "Finished the task." }],
          usage: { prompt_tokens: 100, completion_tokens: 20 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await execute(makeCtx());
    expect(result.exitCode).toBe(0);
    expect(result.summary).toBe("Finished the task.");
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 20 });
    expect(result.sessionParams).toEqual({ agentId: "agent-letta-123" });
    expect(result.provider).toBe("letta");
    expect(captured?.url).toContain("/v1/agents/agent-letta-123/messages");
  });

  it("surfaces HTTP failures as a non-zero exit", async () => {
    globalThis.fetch = (async () =>
      new Response("boom", { status: 500 })) as unknown as typeof fetch;
    const result = await execute(makeCtx());
    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("failed");
  });
});
