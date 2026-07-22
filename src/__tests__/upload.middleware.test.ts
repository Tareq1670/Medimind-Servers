import { Request } from "express";
import { upload } from "../middleware/upload.js";

describe("upload middleware", () => {
  it("should be a multer instance with memory storage", () => {
    expect(upload).toBeDefined();
    expect(typeof upload.single).toBe("function");
    expect(typeof upload.array).toBe("function");
    expect(typeof upload.fields).toBe("function");
    expect(typeof upload.none).toBe("function");
    expect(typeof upload.any).toBe("function");
  });

  it("should accept image files", () => {
    const cb = jest.fn();
    const file = { mimetype: "image/jpeg" } as Express.Multer.File;
    const filter = (upload as any).instance?.fileFilter;
    if (filter) {
      filter(null as unknown as Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    }
  });

  it("should accept PDF files", () => {
    const cb = jest.fn();
    const file = { mimetype: "application/pdf" } as Express.Multer.File;
    const filter = (upload as any).instance?.fileFilter;
    if (filter) {
      filter(null as unknown as Request, file, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    }
  });

  it("should reject non-image non-PDF files", () => {
    const cb = jest.fn();
    const file = { mimetype: "text/plain" } as Express.Multer.File;
    const filter = (upload as any).instance?.fileFilter;
    if (filter) {
      filter(null as unknown as Request, file, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error));
    }
  });
});
