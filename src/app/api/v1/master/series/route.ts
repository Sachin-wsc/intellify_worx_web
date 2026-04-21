import { NextResponse } from "next/server";
import { db } from "@/db";
import { series, brands, seriesBrands } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";
import { getExtension } from "@/lib/utils";

export async function GET() {
    try {
        const allSeries = await db
            .select({
                id: series.id,
                name: series.name,
                iconUrl: series.iconUrl,
                isActive: series.isActive,
                createdAt: series.createdAt,
                updatedAt: series.updatedAt,
            })
            .from(series)
            .orderBy(series.name);

        // Fetch brand associations for each series
        const seriesWithBrands = await Promise.all(allSeries.map(async (s) => {
            const relatedBrands = await db
                .select({
                    id: brands.id,
                    name: brands.name,
                })
                .from(seriesBrands)
                .innerJoin(brands, eq(seriesBrands.brandId, brands.id))
                .where(eq(seriesBrands.seriesId, s.id));

            return {
                ...s,
                brands: relatedBrands,
                brandNames: relatedBrands.map(b => b.name).join(", "),
            };
        }));
            
        return NextResponse.json(seriesWithBrands);
    } catch (err) {
        console.error("GET /master/series error", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let name = "";
        let brandIds: string[] = [];
        let iconUrl: string | null = null;

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

        // Check if series name already exists
        const existing = await db.select().from(series).where(eq(series.name, name));
        if (existing.length > 0) {
            return NextResponse.json({ error: "Series with this name already exists" }, { status: 400 });
        }

        const newId = crypto.randomUUID();
        await db.insert(series).values({
            id: newId,
            name,
            iconUrl,
        });

        // Insert associations
        if (brandIds.length > 0) {
            const associationValues = brandIds.map(brandId => ({
                id: crypto.randomUUID(),
                seriesId: newId,
                brandId: brandId
            }));
            await db.insert(seriesBrands).values(associationValues);
        }

        const [newSeries] = await db.select().from(series).where(eq(series.id, newId));

        return NextResponse.json(newSeries, { status: 201 });
    } catch (err) {
        console.error("POST /master/series error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
