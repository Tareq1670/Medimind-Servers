const mockInsertOne = jest.fn();
const mockCollection = jest.fn();

jest.mock("../config/db.js", () => ({
  getDB: jest.fn(() => ({
    collection: mockCollection,
  })),
}));

import * as contactService from "../services/contact.service.js";

describe("contact.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCollection.mockReturnValue({
      insertOne: mockInsertOne,
    });
  });

  describe("submitContactForm", () => {
    it("should insert contact submission", async () => {
      mockInsertOne.mockResolvedValue({ insertedId: "123" });

      const data = { name: "John", email: "john@test.com", subject: "Question", message: "Hello" };
      await contactService.submitContactForm(data);

      expect(mockInsertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "John",
          email: "john@test.com",
          subject: "Question",
          message: "Hello",
          createdAt: expect.any(Date),
        })
      );
    });
  });
});
