import { NextResponse } from "next/server";
import { db } from "@/db";
import { companies } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";
import { getExtension } from "@/lib/utils";

export async function GET() {
    try {
        const allCompanies = await db.select().from(companies).orderBy(companies.name);
        return NextResponse.json(allCompanies);
    } catch (err) {
        console.error("GET /master/companies error", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const contentType = request.headers.get("content-type") || "";
        let name = "";
        let logoUrl: string | null = null;

        if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            name = formData.get("name") as string;
            const logoFile = formData.get("logo") as File | null;

            if (logoFile && logoFile.size > 0) {
                const uploadDir = path.join(process.cwd(), "public", "uploads");
                await mkdir(uploadDir, { recursive: true });

                const bytes = await logoFile.arrayBuffer();
                const buffer = Buffer.from(bytes);
                const ext = getExtension(logoFile.type);
                const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
                const filepath = path.join(uploadDir, filename);
                await writeFile(filepath, buffer);
                logoUrl = `/uploads/${filename}`;
            }
        } else {
            const body = await request.json();
            name = body.name;
        }

        if (!name) {
            return NextResponse.json({ error: "Missing required field: name" }, { status: 400 });
        }

        // Check if it already exists
        const existing = await db.select().from(companies).where(eq(companies.name, name));
        if (existing.length > 0) {
            return NextResponse.json(existing[0], { status: 200 });
        }

        const newId = crypto.randomUUID();
        await db.insert(companies).values({
            id: newId,
            name,
            logoUrl,
        });

        const [newCompany] = await db.select().from(companies).where(eq(companies.id, newId));

        return NextResponse.json(newCompany, { status: 201 });
    } catch (err) {
        console.error("POST /master/companies error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
