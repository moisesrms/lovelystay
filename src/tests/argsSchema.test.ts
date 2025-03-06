import { describe, expect, it } from "vitest";
import { ListArgsType, validateInput } from "../argsSchema";

describe("Input Validation", () => {
  describe("Fetch Command", () => {
    it("should validate a valid fetch command", () => {
      const args = {
        _: [],
        f: true,
        name: "John Doe",
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          _: [],
          f: true,
          command: "fetch",
          name: "John Doe",
        });
      }
    });

    it("should reject fetch command without name", () => {
      const args = {
        _: [],
        f: true,
      };
      const result = validateInput(args);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "Name is required for fetch command"
        );
      }
    });

    it("should reject fetch command with SQL injection attempt", () => {
      const args = {
        _: [],
        f: true,
        name: "Robert'; DROP TABLE users;--",
      };
      const result = validateInput(args);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "Invalid characters or SQL keywords detected"
        );
      }
    });
  });

  describe("List Command", () => {
    it("Should validate a list command with optional parameters.", () => {
      const args = {
        _: [],
        l: true,
        name: "John Doe",
        location: "New York",
        languages: "JavaScript,Python",
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        const listData = result.data as ListArgsType;
        expect(listData).toEqual({
          _: [],
          l: true,
          command: "list",
          name: "John Doe",
          location: "New York",
          languages: ["JavaScript", "Python"],
        });
      }
    });

    it("should validate list command with no optional parameters", () => {
      const args = {
        _: [],
        l: true,
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
    });

    it("should validate list command with array of languages", () => {
      const args = {
        _: [],
        l: true,
        languages: ["JavaScript", "Python"],
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        const listData = result.data as ListArgsType;
        expect(listData.languages).toEqual(["JavaScript", "Python"]);
      }
    });

    it("should validate list command with comma-separated languages", () => {
      const args = {
        _: [],
        l: true,
        languages: "JavaScript,Python",
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        const listData = result.data as ListArgsType;
        expect(listData.languages).toEqual(["JavaScript", "Python"]);
      }
    });

    it("should reject list command with invalid location characters", () => {
      const args = {
        _: [],
        l: true,
        location: "New York!@#",
      };
      const result = validateInput(args);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe(
          "Location can only contain letters, numbers, spaces, and commas"
        );
      }
    });

    it("should reject list command with invalid language characters.", () => {
      const args = {
        _: [],
        l: true,
        languages: "JavaScript!,Python@",
      };
      const result = validateInput(args);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain(
          "Programming languages can only contain letters"
        );
      }
    });

    it("should accept valid language names with allowed symbols.", () => {
      const args = {
        _: [],
        l: true,
        languages: "C++,C#",
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        const listData = result.data as ListArgsType;
        expect(listData.languages).toEqual(["C++", "C#"]);
      }
    });
  });

  describe("Help Command", () => {
    it("should validate help command", () => {
      const args = {
        _: [],
        h: true,
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          _: [],
          h: true,
          command: "help",
        });
      }
    });
  });

  describe("Invalid Commands", () => {
    it("should default to help when no valid flag is provided", () => {
      const args = {
        _: [],
      };
      const result = validateInput(args);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.command).toBe("help");
      }
    });

    it("should reject unknown parameters", () => {
      const args = {
        _: [],
        f: true,
        name: "John Doe",
        unknown: "parameter",
      };
      const result = validateInput(args);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain("Unrecognized key");
      }
    });
  });
});
