import { lstat, rm } from "node:fs/promises";
import path from "node:path";

/** Next chưa có API xoá cache ảnh theo URL; xoá cache có thể dựng lại sau khi xoá media. */
export async function purgeOptimizedImageCache(): Promise<void> {
  const nextDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), ".next");
  const cacheDir = path.join(nextDir, "cache");
  for (const dir of [nextDir, cacheDir]) {
    const info = await lstat(/* turbopackIgnore: true */ dir).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!info) return;
    if (!info.isDirectory() || info.isSymbolicLink()) {
      throw new Error("Không xoá cache ảnh qua đường dẫn liên kết hoặc thư mục không hợp lệ.");
    }
  }
  await rm(/* turbopackIgnore: true */ path.join(cacheDir, "images"), { recursive: true, force: true });
}
