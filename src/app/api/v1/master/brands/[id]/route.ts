import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands, brandCompanies } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";
import { getExtension } from "@/lib/utils";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const contentType = request.headers.get("content-type") || "";
        
        let name = "";
        let companyIds: string[] = [];
        let iconUrl: string | undefined = undefined;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            name = formData.get("name") as string;
            const companyIdsStr = formData.get("companyIds") as string;
            companyIds = companyIdsStr ? JSON.parse(companyIdsStr) : [];
            const iconFile = formData.get("icon") as File | null;

            if (iconFile && iconFile.size > 0) {
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await mkdir(uploadDir, { recursive: true });

                const bytes = await iconFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const ext = getExtension(iconFile.type);
                const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                iconUrl = `/uploads/${filename}`;
            }
        } else {
            const body = await request.json();
            name = body.name;
            companyIds = body.companyIds || [];
        }

        if (!name || companyIds.length === 0) {
            return NextResponse.json({ error: "Missing required fields: name, companyIds" }, { status: 400 });
        }

        const updateData: any = { name, updatedAt: new Date() };
        if (iconUrl !== undefined) {
            updateData.iconUrl = iconUrl;
        }

        await db.update(brands)
            .set(updateData)
            .where(eq(brands.id, id));

        // Update associations: delete old and insert new
        await db.delete(brandCompanies).where(eq(brandCompanies.brandId, id));
        
        if (companyIds.length > 0) {
            const associationValues = companyIds.map(companyId => ({
                id: crypto.randomUUID(),
                brandId: id,
                companyId: companyId
            }));
            await db.insert(brandCompanies).values(associationValues);
        }

        const [updatedBrand] = await db.select().from(brands).where(eq(brands.id, id));

        if (!updatedBrand) {
            return NextResponse.json({ error: "Brand not found" }, { status: 404 });
        }

        return NextResponse.json(updatedBrand, { status: 200 });
    } catch (err) {
        console.error(`PATCH /master/brands/ error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        
        await db.delete(brands)
            .where(eq(brands.id, id));

        return NextResponse.json({ message: "Brand deleted successfully" }, { status: 200 });
    } catch (err) {
        console.error(`DELETE /master/brands/ error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
