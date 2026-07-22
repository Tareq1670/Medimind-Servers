const mockFetch = jest.fn();
global.fetch = mockFetch;

jest.mock("../config/env.js", () => ({
  env: { groqApiKey: "test-groq-key" },
}));

import * as groqService from "../services/groq.service.js";

describe("groq.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("analyzeWithGroq", () => {
    it("should call Groq API and return content", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: "AI response" } }],
        }),
      });

      const result = await groqService.analyzeWithGroq("test prompt");

      expect(result).toBe("AI response");
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.groq.com/openai/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-groq-key",
          }),
        })
      );
    });

    it("should throw when API call fails", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: jest.fn().mockResolvedValue("Unauthorized"),
      });

      await expect(groqService.analyzeWithGroq("test")).rejects.toThrow("Groq API error (401)");
    });

    it("should throw when API key is missing", async () => {
      const envModule = require("../config/env.js");
      envModule.env.groqApiKey = "";

      await expect(groqService.analyzeWithGroq("test")).rejects.toThrow("GROQ_API_KEY is not configured");
    });
  });
});
