import { NextResponse } from "next/server";
import { db } from "@/db";
import { series, seriesBrands } from "@/db/schema";
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
        let brandIds: string[] = [];
        let iconUrl: string | undefined = undefined;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            name = formData.get("name") as string;
            const brandIdsStr = formData.get("brandIds") as string;
            brandIds = brandIdsStr ? JSON.parse(brandIdsStr) : [];
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
            brandIds = body.brandIds || [];
        }

        if (!name || brandIds.length === 0) {
            return NextResponse.json({ error: "Missing required fields: name, brandIds" }, { status: 400 });
        }

        const updateData: any = { name, updatedAt: new Date() };
        if (iconUrl !== undefined) {
            updateData.iconUrl = iconUrl;
        }

        await db.update(series)
            .set(updateData)
            .where(eq(series.id, id));

        // Update associations: delete old and insert new
        await db.delete(seriesBrands).where(eq(seriesBrands.seriesId, id));
        
        if (brandIds.length > 0) {
            const associationValues = brandIds.map(brandId => ({
                id: crypto.randomUUID(),
                seriesId: id,
                brandId: brandId
            }));
            await db.insert(seriesBrands).values(associationValues);
        }

        const [updatedSeries] = await db.select().from(series).where(eq(series.id, id));

        if (!updatedSeries) {
            return NextResponse.json({ error: "Series not found" }, { status: 404 });
        }

        return NextResponse.json(updatedSeries, { status: 200 });
    } catch (err) {
        console.error(`PATCH /master/series/ error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        
        await db.delete(series)
            .where(eq(series.id, id));

        return NextResponse.json({ message: "Series deleted successfully" }, { status: 200 });
    } catch (err) {
        console.error(`DELETE /master/series/ error:`, err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
