"use server";

import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { resolveImageUrl } from "@/lib/media";
import { autoFillTranslations } from "@/lib/translate";
import { slugify } from "@/lib/utils";
import { requirePermission } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { facultyListSearch, type FacultyListParams } from "./list-query";

export type FacultySaveResult = {
  message: string;
  fields?: Partial<Record<"name" | "role" | "sortOrder" | "photo", string>>;
};

export async function upsertFacultyAction(listParams: FacultyListParams, formData: FormData): Promise<FacultySaveResult> {
  await requirePermission("faculty");
  const id = String(formData.get("id") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "").trim();
  const departmentId = String(formData.get("departmentId") || "").trim();
  const degree = String(formData.get("degree") || "").trim();
  const academicRank = String(formData.get("academicRank") || "").trim();
  const specialty = String(formData.get("specialty") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const sortOrder = Number(formData.get("sortOrder") || 0);
  const roleEn = String(formData.get("roleEn") || "").trim();
  const degreeEn = String(formData.get("degreeEn") || "").trim();
  const academicRankEn = String(formData.get("academicRankEn") || "").trim();
  const specialtyEn = String(formData.get("specialtyEn") || "").trim();
  const bioEn = String(formData.get("bioEn") || "").trim();

  const fields: FacultySaveResult["fields"] = {};
  if (!name) fields.name = "Nhập họ tên giảng viên.";
  if (!role) fields.role = "Chọn chức vụ của giảng viên.";
  if (!Number.isInteger(sortOrder) || sortOrder < -2147483648 || sortOrder > 2147483647) {
    fields.sortOrder = "Nhập số nguyên hợp lệ cho vị trí hiển thị.";
  }
  if (Object.keys(fields).length > 0) {
    return { message: "Chưa lưu hồ sơ. Kiểm tra lại thông tin bên dưới.", fields };
  }

  try {
    const current = id
      ? await db.query.faculty.findFirst({ where: eq(schema.faculty.id, id) })
      : null;
    if (id && !current) {
      return { message: "Hồ sơ này không còn tồn tại. Hãy quay lại danh sách để kiểm tra." };
    }

    let photoUrl: string | null;
    try {
      photoUrl = await resolveImageUrl(formData, "photo", "photoExisting", current?.photoUrl ?? null);
    } catch (error) {
      console.error("Không xử lý được ảnh giảng viên.", error);
      return {
        message: "Chưa lưu hồ sơ vì không xử lý được ảnh chân dung.",
        fields: { photo: "Kiểm tra định dạng và dung lượng ảnh, hoặc chọn ảnh khác rồi thử lại." },
      };
    }

    const [roleEnFinal, degreeEnFinal, academicRankEnFinal, specialtyEnFinal, bioEnFinal] =
      await autoFillTranslations([
        { vi: role, en: roleEn },
        { vi: degree, en: degreeEn },
        { vi: academicRank, en: academicRankEn },
        { vi: specialty, en: specialtyEn },
        { vi: bio, en: bioEn },
      ]);

    const values = {
      name,
      role,
      roleEn: roleEnFinal || null,
      departmentId: departmentId || null,
      degree: degree || null,
      degreeEn: degreeEnFinal || null,
      academicRank: academicRank || null,
      academicRankEn: academicRankEnFinal || null,
      specialty: specialty || null,
      specialtyEn: specialtyEnFinal || null,
      bio: bio || null,
      bioEn: bioEnFinal || null,
      sortOrder,
      photoUrl,
    };

    if (id) {
      const updated = await db.update(schema.faculty).set(values).where(eq(schema.faculty.id, id)).returning({ id: schema.faculty.id });
      if (updated.length === 0) {
        return { message: "Hồ sơ này vừa bị xóa. Hãy quay lại danh sách để kiểm tra." };
      }
    } else {
      const baseSlug = slugify(name) || `giang-vien-${Date.now()}`;
      let slug = baseSlug;
      let counter = 1;
      // Đảm bảo slug duy nhất — nếu trùng thì thêm hậu tố -2, -3...
      while (await db.query.faculty.findFirst({ where: eq(schema.faculty.slug, slug) })) {
        counter += 1;
        slug = `${baseSlug}-${counter}`;
      }
      await db.insert(schema.faculty).values({ ...values, slug });
    }
  } catch (error) {
    console.error("Không lưu được hồ sơ giảng viên.", error);
    return { message: "Chưa lưu được hồ sơ. Vui lòng thử lại sau ít phút." };
  }

  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  revalidatePath("/doi-ngu-giang-vien", "layout");

  redirect(`/admin/giang-vien${facultyListSearch(listParams, true, formData.get("facultyDraftToken"))}`);
}

export async function deleteFacultyAction(facultyId: string) {
  await requirePermission("faculty");
  await db.delete(schema.faculty).where(eq(schema.faculty.id, facultyId));
  revalidatePath("/admin/giang-vien");
  revalidatePath("/");
  revalidatePath("/doi-ngu-giang-vien", "layout");
}
