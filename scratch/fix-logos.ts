import { db } from "./src/db";
import { companies } from "./src/db/schema";
import { eq } from "drizzle-orm";

async function fixLogos() {
  const allCompanies = await db.select().from(companies);
  for (const company of allCompanies) {
    if (company.logoUrl && company.logoUrl.endsWith(".bin")) {
      const newLogoUrl = company.logoUrl.replace(".bin", ".png");
      await db.update(companies).set({ logoUrl: newLogoUrl }).where(eq(companies.id, company.id));
      console.log(`Updated logo for ${company.name}`);
    }
  }
  process.exit(0);
}

fixLogos();
