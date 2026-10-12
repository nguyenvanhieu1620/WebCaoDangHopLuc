# Hướng dẫn phối hợp Codex + Claude Code

## Bối cảnh và hướng dẫn hiện có

- Đọc `CLAUDE.md`, `README.md` và `package.json` trước khi làm việc; giữ các quyết định kiến trúc và hướng dẫn hiện có. Nếu tài liệu khác mã nguồn, đối chiếu file thực tế và báo rõ điểm lệch.
- Dự án dùng Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM và PostgreSQL qua driver `pg` (dev: `docker compose up -d`; test: PGlite trong bộ nhớ). Dùng các script thực tế trong `package.json`; migration hiện là `db:generate` và `db:migrate`. Danh sách luôn sắp xếp kèm khoá phụ `seq` (xem đầu `src/lib/db/schema.ts`).

## Vai trò

- Codex điều phối, chia nhiệm vụ, xác định phạm vi, kiểm tra và tích hợp kết quả.
- Claude nhận phần triển khai hoặc review qua CLI. Phải gọi Claude thực sự và chờ phản hồi; không trình bày suy đoán của Codex như kết quả của Claude.
- Mỗi nhiệm vụ phải nêu rõ yêu cầu, danh sách file được sửa (hoặc chỉ đọc nếu review), tiêu chí hoàn thành và cách kiểm tra. Prompt giao cho Claude phải yêu cầu đọc `AGENTS.md` và `CLAUDE.md`, đồng thời ghi đầy đủ phạm vi này.

## Cách gọi Claude

- Kiểm tra bằng `claude --version`. Nếu lệnh không có trong PATH, kiểm tra đường dẫn rồi dùng cú pháp PowerShell: `& "C:\Users\HOPLUCGROUP\AppData\Local\Microsoft\WinGet\Links\claude.exe"`.
- Phân tích/review chỉ đọc: dùng `-p "<yêu cầu, file được đọc, tiêu chí hoàn thành; chỉ phân tích>" --tools "Read,Glob,Grep" --disallowedTools "mcp__*"`.
- Với triển khai, cấp công cụ phù hợp phạm vi nhiệm vụ và quyền đã được người dùng cho phép; không dùng cờ bỏ qua kiểm soát quyền. Yêu cầu Claude báo file đã sửa, kết quả kiểm tra và vấn đề còn lại.
- Chờ tiến trình kết thúc, kiểm tra mã thoát và nội dung phản hồi. Nếu kết nối lỗi, báo lỗi thật; không coi nhiệm vụ đã hoàn thành.

## Thư mục làm việc và tích hợp

- Làm lần lượt khi dùng chung thư mục: bên này kết thúc thao tác ghi trước khi bên kia sửa hoặc tích hợp. Kiểm tra `git status` trước và sau mỗi nhiệm vụ, giữ thay đổi sẵn có của người dùng.
- Khi viết code song song, dùng Git worktree riêng và nhánh riêng cho từng bên. Codex đối chiếu diff, xử lý xung đột và tích hợp từng kết quả sau khi kiểm tra.
- Codex kiểm tra kết quả Claude với mã nguồn và tiêu chí hoàn thành; chạy kiểm tra phù hợp thay đổi, như lint, TypeScript hoặc build. Với thay đổi tài liệu, kiểm tra nội dung và diff.
- Báo rõ phần việc của Codex, phần việc của Claude, file thay đổi, kiểm tra đã chạy và giới hạn còn lại. Không tuyên bố chức năng hoàn tất chỉ dựa trên tài liệu hoặc phản hồi của Claude.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
