import { NextResponse } from "next/server";
import { db } from "@/db";
import { brands, companies, brandCompanies } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";
import { getExtension } from "@/lib/utils";

export async function GET() {
    try {
        const allBrands = await db
            .select({
                id: brands.id,
                name: brands.name,
                iconUrl: brands.iconUrl,
                isActive: brands.isActive,
                createdAt: brands.createdAt,
                updatedAt: brands.updatedAt,
            })
            .from(brands)
            .orderBy(brands.name);

        // Fetch company associations for each brand
        const brandsWithCompanies = await Promise.all(allBrands.map(async (brand) => {
            const relatedCompanies = await db
                .select({
                    id: companies.id,
                    name: companies.name,
                })
                .from(brandCompanies)
                .innerJoin(companies, eq(brandCompanies.companyId, companies.id))
                .where(eq(brandCompanies.brandId, brand.id));

            return {
                ...brand,
                companies: relatedCompanies,
                companyNames: relatedCompanies.map(c => c.name).join(", "),
            };
        }));
            
        return NextResponse.json(brandsWithCompanies);
    } catch (err) {
        console.error("GET /master/brands error", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let name = "";
        let companyIds: string[] = [];
        let iconUrl: string | null = null;

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

        // Check if brand name already exists
        const existing = await db.select().from(brands).where(eq(brands.name, name));
        if (existing.length > 0) {
            return NextResponse.json({ error: "Brand with this name already exists" }, { status: 400 });
        }

        const newId = crypto.randomUUID();
        await db.insert(brands).values({
            id: newId,
            name,
            iconUrl,
        });

        // Insert associations
        if (companyIds.length > 0) {
            const associationValues = companyIds.map(companyId => ({
                id: crypto.randomUUID(),
                brandId: newId,
                companyId: companyId
            }));
            await db.insert(brandCompanies).values(associationValues);
        }

        const [newBrand] = await db.select().from(brands).where(eq(brands.id, newId));

        return NextResponse.json(newBrand, { status: 201 });
    } catch (err) {
        console.error("POST /master/brands error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
