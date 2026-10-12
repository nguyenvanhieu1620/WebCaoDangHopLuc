import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Khớp docker-compose.yml khi chưa có .env (xem src/lib/db/client.ts).
    url: process.env.DATABASE_URL || "postgres://hopluc:hopluc_dev@localhost:5432/hopluc",
  },
} satisfies Config;
