const mockGenerateContent = jest.fn();
const mockSendMessageStream = jest.fn();
const mockStartChat = jest.fn();
const mockGetGenerativeModel = jest.fn();

jest.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

jest.mock("../config/env.js", () => ({
  env: { geminiApiKey: "test-gemini-key" },
}));

import * as geminiService from "../services/gemini.service.js";

function createMockModel() {
  const response = { text: jest.fn().mockReturnValue("response text") };
  const result = { response };
  return {
    generateContent: jest.fn().mockResolvedValue(result),
    startChat: mockStartChat,
  };
}

describe("gemini.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateWithPro", () => {
    it("should generate content and return text", async () => {
      const mockModel = createMockModel();
      mockGetGenerativeModel.mockReturnValue(mockModel);

      const result = await geminiService.generateWithPro("test prompt");

      expect(result).toBe("response text");
      expect(mockModel.generateContent).toHaveBeenCalledWith("test prompt");
    });

    it("should throw when API key is not configured", async () => {
      jest.resetModules();
      jest.mock("../config/env.js", () => ({
        env: { geminiApiKey: "" },
      }));
      const { generateWithPro: genPro } = await import("../services/gemini.service.js");

      await expect(genPro("test")).rejects.toThrow("GEMINI_API_KEY is not configured");
    });
  });

  describe("generateWithFlash", () => {
    it("should generate content with flash model", async () => {
      const mockModel = createMockModel();
      mockGetGenerativeModel.mockReturnValue(mockModel);

      const result = await geminiService.generateWithFlash("test prompt");

      expect(result).toBe("response text");
    });
  });

  describe("streamChat", () => {
    it("should stream chat messages", async () => {
      const onChunk = jest.fn();
      const mockStream = {
        stream: (async function* () {
          yield { text: () => "Hello " };
          yield { text: () => "World" };
        })(),
      };
      const mockChat = {
        sendMessageStream: jest.fn().mockResolvedValue(mockStream),
      };
      mockStartChat.mockReturnValue(mockChat);
      const mockModel = createMockModel();
      mockGetGenerativeModel.mockReturnValue(mockModel);

      const result = await geminiService.streamChat(
        [{ role: "user", content: "Hi" }],
        "system prompt",
        onChunk
      );

      expect(result).toBe("Hello World");
      expect(onChunk).toHaveBeenCalledTimes(2);
      expect(onChunk).toHaveBeenNthCalledWith(1, "Hello ");
      expect(onChunk).toHaveBeenNthCalledWith(2, "World");
    });
  });

  describe("analyzeImageWithVision", () => {
    it("should analyze image with vision model", async () => {
      const mockModel = createMockModel();
      mockGetGenerativeModel.mockReturnValue(mockModel);
      global.fetch = jest.fn().mockResolvedValue({
        headers: new Map([["content-type", "image/jpeg"]]),
        arrayBuffer: jest.fn().mockResolvedValue(Buffer.from("fake-image-data")),
      });

      const result = await geminiService.analyzeImageWithVision("https://img.url", "analyze this");

      expect(result).toBe("response text");
    });
  });
});
