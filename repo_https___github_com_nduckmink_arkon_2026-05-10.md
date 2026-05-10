# 📊 Báo cáo phân tích bảo mật mã nguồn  
**Repository:** `https://github.com/nduckmink/arkon`  
**Ngày phân tích:** 10‑05‑2026  

---  

## 1️⃣ Đánh giá rủi ro tổng thể  

| Thành phần | Số lượng lỗ hổng | Mức độ | Nhận xét |
|------------|------------------|--------|----------|
| Dockerfile | 2 lỗ hổng | **ERROR** (cấp **High**) | Chạy container dưới tài khoản `root`. |
| Alembic migration scripts (SQLAlchemy) | 6 lỗ hổng | **ERROR** (cấp **High**) + **WARNING** (cấp **Medium**) | Sử dụng `text()` và chuỗi SQL được format → nguy cơ SQL Injection. |
| Front‑end (React/TSX) | 1 lỗ hổng | **INFO** (cấp **Low**) | Định dạng chuỗi không an toàn trong `console.log`. |
| Secrets | **Không phát hiện** (TruffleHog trả về `[]`). |
| Lỗi phân tích (PartialParsing) | 5 cảnh báo | **INFO** | Các file TSX không thể parse hoàn toàn – không phải lỗ hổng bảo mật, nhưng có thể che giấu lỗi tiềm ẩn. |

**Kết luận:** Repo có **rủi ro cao** do các lỗ hổng SQL Injection và cấu hình Docker không an toàn. Các vấn đề này có thể cho phép kẻ tấn công thực thi mã trên server hoặc chiếm quyền root trong container.

---  

## 2️⃣ 🕷️ Mức độ ảnh hưởng (Blast Radius)

| Yếu tố | Đánh giá | Giải thích |
|--------|----------|------------|
| **Kiến trúc**: Ứng dụng FastAPI + SQLAlchemy, chạy trong Docker, front‑end Next.js. | **Rộng** | Nếu container chạy dưới `root`, một lỗ hổng trong API (ví dụ SQL Injection) có thể cho phép kẻ tấn công thực thi lệnh hệ thống trong container và, nếu host không được cô lập đúng, lan rộng ra hệ thống máy chủ. |
| **Dữ liệu nhạy cảm**: Không có secret hard‑coded, nhưng DB chứa thông tin dự án, người dùng, quyền truy cập. | **Trung bình‑cao** | Lộ dữ liệu người dùng hoặc quyền RBAC có thể gây mất tính toàn vẹn và bảo mật của hệ thống. |
| **Mối liên kết dịch vụ**: Các micro‑service (MCP, AI providers) được gọi từ API. | **Trung bình** | Nếu kẻ tấn công chiếm được container, có thể thao túng các request tới các provider (OpenAI, Anthropic…) để tiêu tốn tài nguyên hoặc thu thập dữ liệu. |
| **Front‑end**: Không có secret, chỉ có log không an toàn. | **Thấp** | Không ảnh hưởng trực tiếp tới hệ thống back‑end. |

**Blast radius**: **Cao** – một lỗ hổng SQL Injection kết hợp với container chạy dưới `root` có thể dẫn tới việc chiếm toàn bộ môi trường triển khai.

---  

## 3️⃣ 🔑 Lộ lọt Bí mật (Secrets)

- **Kết quả TruffleHog:** `[]` → Không phát hiện bất kỳ secret, token, password nào trong mã nguồn được quét.  
- **Lưu ý:** Kiểm tra lại các file `.env*` (ví dụ `.env.docker.example`, `.env.local.example`) chỉ chứa mẫu cấu hình, không chứa giá trị thực.  

> **Kết luận:** Hiện tại không có bí mật bị lộ trong repo.

---  

## 4️⃣ 🚨 Lỗ hổng Logic Code (Semgrep)

### 4.1 Dockerfile – Thiếu USER non‑root  

| File | Dòng | Mô tả | Mức độ |
|------|------|-------|--------|
| `source_code/Dockerfile` | 29‑30 | Không khai báo `USER` → container chạy dưới `root`. | **[!CRITICAL]** |

**Rủi ro:**  
- Nếu kẻ tấn công khai thác bất kỳ lỗ hổng nào trong ứng dụng, họ có thể thực thi lệnh với quyền root trong container, tăng khả năng leo privilege lên host (nếu không có sandbox).  

### 4.2 Alembic migration – SQL Injection  

| File | Dòng | Mô tả | Mức độ |
|------|------|-------|--------|
| `source_code/alembic/versions/011_permission_v2.py` | 107‑109 | Sử dụng `sqlalchemy.text()` với chuỗi có thể chứa dữ liệu người dùng. | **[!CRITICAL]** |
| `source_code/alembic/versions/015_multi_dim_embeddings.py` | 84‑91 | Chuỗi SQL được format (`f"...{var}..."`) và thực thi trực tiếp. | **[!CRITICAL]** |
| `source_code/alembic/versions/015_multi_dim_embeddings.py` | 134 | Cũng có SQL được format và thực thi. | **[!CRITICAL]** |

**Rủi ro:**  
- `text()` và string concatenation bỏ qua cơ chế binding của SQLAlchemy → **SQL Injection**. Nếu bất kỳ biến nào (ví dụ tên skill, mô tả) được lấy từ đầu vào người dùng và truyền tới migration, attacker có thể chạy lệnh SQL tùy ý, thay đổi/đánh cắp dữ liệu, hoặc thậm chí tạo tài khoản admin.

### 4.3 Front‑end – Unsafe format string  

| File | Dòng | Mô tả | Mức độ |
|------|------|-------|--------|
| `source_code/frontend/src/components/skills/skill-editor.tsx` | 239 | `console.log(util.format(...))` với biến không kiểm soát. | **[!NOTE]** (Info) |

**Rủi ro:**  
- Ảnh hưởng chủ yếu tới log; không gây thực thi mã, nhưng có thể làm lộ thông tin nội bộ nếu log được thu thập.

### 4.4 Cảnh báo parsing (PartialParsing)

Các file TSX có lỗi cú pháp (`& Merge`, `&family=...`) – **không phải lỗ hổng bảo mật**, nhưng có thể ngăn Semgrep/ESLint phát hiện các vấn đề khác. Nên sửa để có phân tích đầy đủ.

---  

## 5️⃣ 🛠️ Hướng dẫn Vá lỗi (Remediation)

### 5.1 Dockerfile  

```dockerfile
# Thêm một user không có quyền root
FROM python:3.12-slim AS base

# Tạo user non‑root
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Cài đặt dependencies, copy code, v.v.
# ...

# Chuyển sang user không root
USER appuser

# Đặt entrypoint
ENTRYPOINT ["./entrypoint.sh"]
```

- **Kiểm tra**: Đảm bảo `entrypoint.sh` và các lệnh chạy được thực thi bởi `appuser`.  
- **Optional**: Sử dụng `--chown` khi copy file để tránh quyền root trên file hệ thống.

### 5.2 SQLAlchemy – Tránh `text()` và string formatting  

#### 5.2.1 Thay `sqlalchemy.text()` bằng expression API  

```python
# Thay
stmt = text(f"SELECT * FROM permission WHERE name = '{perm_name}'")
# Bằng
stmt = select(Permission).where(Permission.name == bindparam('perm_name'))
session.execute(stmt, {"perm_name": perm_name})
```

#### 5.2.2 Sử dụng `bindparam` hoặc `:named` parameters  

```python
# Ví dụ trong migration 015_multi_dim_embeddings.py
sql = """
INSERT INTO embedding (skill_id, vector)
VALUES (:skill_id, :vector)
"""
op.execute(sql, {"skill_id": skill_id, "vector": vector})
```

#### 5.2.3 Kiểm tra mọi `op.execute()` hoặc `session.execute()` trong các file migration để chắc chắn không có chuỗi được format trực tiếp.

### 5.3 Front‑end – Định dạng log an toàn  

```ts
// Trước
console.log(util.format(message, userInput));

// Sau
console.log(message, { userInput });   // hoặc dùng template literal cố định
```

- Tránh truyền biến vào vị trí format string; luôn để chuỗi định dạng cố định.

### 5.4 Sửa lỗi parsing TSX  

- Kiểm tra các file được liệt kê trong phần `errors` và sửa cú pháp (thay `& Merge` bằng `&amp; Merge` hoặc dùng JSX đúng).  
- Đảm bảo các URL trong `layout.tsx` được đặt trong dấu ngoặc kép và escape ký tự `&`.

### 5.5 Kiểm tra và củng cố CI/CD  

1. **Thêm bước kiểm tra Dockerfile**:  
   ```bash
   docker run --rm -i hadolint/hadolint < Dockerfile
   ```  
   Đảm bảo `USER` được khai báo.  

2. **Chạy Semgrep trong pipeline** và **fail build** nếu có `severity: ERROR`.  

3. **Thêm TruffleHog** (hoặc GitGuardian) vào CI để phát hiện secret trong commit tương lai.  

4. **Kiểm tra quyền file**: Đảm bảo chỉ có `appuser` có quyền ghi vào thư mục cần thiết, tránh việc container chạy dưới root tạo file sở hữu root.

---  

## 📌 Tổng kết  

- **Rủi ro cao** do cấu hình Docker không an toàn và các lỗ hổng SQL Injection trong migration scripts.  
- **Không có secret** bị lộ hiện tại, nhưng cần duy trì kiểm tra tự động.  
- **Remediation**: Thêm user non‑root, chuyển toàn bộ truy vấn SQL sang parameterized queries, và sửa các cảnh báo parsing.  

Áp dụng các biện pháp trên sẽ giảm đáng kể blast radius và nâng cao mức độ bảo mật của toàn bộ hệ thống.  

---  

*Báo cáo được trích xuất bởi engine Opus 4.7 Mythos Security Analyzer – không có thông tin giả tạo.*