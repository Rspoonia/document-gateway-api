import { getConfig, AppEnv, parseIntSafe } from "./configuration";

describe("getConfig", () => {
  beforeEach(() => {
    process.env.PORT = "4000";
    process.env.APP_ENV = "dev";
    process.env.JWT_EXPIRY = "1h";
    process.env.JWT_SECRET = "secret";
    process.env.DB_HOST = "localhost";
    process.env.DB_PORT = "5432";
    process.env.POSTGRES_USER = "user";
    process.env.POSTGRES_PASSWORD = "password";
    process.env.POSTGRES_DB = "database";
    process.env.UPLOAD_PATH = "/uploads";
    process.env.UPLOAD_MAX_FILE_SIZE = "1048576";
  });

  it("should return the correct configuration when all environment variables are set", () => {
    const config = getConfig();
    expect(config).toEqual({
      port: 4000,
      appEnv: AppEnv.DEV,
      jwt: {
        expiry: "1h",
        secret: "secret",
      },
      database: {
        host: "localhost",
        port: 5432,
        user: "user",
        password: "password",
        dbName: "database",
      },
      upload: {
        path: "/uploads",
        maxFileSize: 1048576,
      },
    });
  });

  it("should use default values when environment variables are not set", () => {
    delete process.env.PORT;
    delete process.env.JWT_EXPIRY;
    delete process.env.DB_PORT;
    delete process.env.UPLOAD_MAX_FILE_SIZE;

    const config = getConfig();
    expect(config.port).toBe(3000);
    expect(config.jwt.expiry).toBe("2h");
    expect(config.database.port).toBe(5432);
    expect(config.upload.maxFileSize).toBe(1024 * 1024);
  });

  it("should handle missing optional environment variables", () => {
    delete process.env.JWT_SECRET;

    const config = getConfig();
    expect(config.jwt.secret).toBeUndefined();
  });

  describe("parseIntSafe", () => {
    it("should return fallback when num is undefined", () => {
      expect(parseIntSafe(undefined, 10)).toEqual(10);
    });

    it("should use the given num", () => {
      expect(parseIntSafe("10", 10)).toEqual(10);
    });

    it("should give fallback if provided num evaluates to NaN", () => {
      expect(parseIntSafe("abc", 10)).toEqual(10);
    });
  });
});
