import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AppConfig } from "./app.config";

describe("AppConfig", () => {
  const envInitial = { ...process.env };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = { ...envInitial };
  });

  it("expose les valeurs par défaut de la base locale", () => {
    delete process.env.SCALINGO_POSTGRESQL_URL;
    delete process.env.DB_HOST;
    const config = new AppConfig();
    expect(config.database.host).toBe("localhost");
    expect(config.database.port).toBe(5432);
    expect(config.database.user).toBe("mutafriches_user");
  });

  it("parse SCALINGO_POSTGRESQL_URL en priorité", () => {
    process.env.SCALINGO_POSTGRESQL_URL = "postgres://u:p@dbhost:6000/mabase";
    const config = new AppConfig();
    expect(config.database.host).toBe("dbhost");
    expect(config.database.port).toBe(6000);
    expect(config.database.user).toBe("u");
    expect(config.database.database).toBe("mabase");
    expect(config.database.ssl).toEqual({ rejectUnauthorized: false });
  });

  it("throw au constructeur si une variable est invalide", () => {
    process.env.PORT = "pas-un-nombre";
    expect(() => new AppConfig()).toThrow(/PORT/);
  });
});
