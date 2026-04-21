import { mysqlTable, varchar, text, boolean, timestamp, decimal, json } from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

/* =====================================================
   USERS
===================================================== */

export const users = mysqlTable("users", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: varchar("email", { length: 255 }).unique().notNull(),
    password: text("password").notNull(),
    role: varchar("role", { length: 50 }).default("admin").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/* =====================================================
   MASTER TABLES
===================================================== */

export const motorTypes = mysqlTable("motor_types", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 50 }).unique().notNull(), // AC / DC
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
});

export const masterPoles = mysqlTable("master_poles", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    poleNumber: varchar("pole_number", { length: 20 }).unique().notNull(), // 2,4,6,8
    isActive: boolean("is_active").default(true).notNull(),
});

export const masterVoltages = mysqlTable("master_voltages", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    voltageValue: decimal("voltage_value", { precision: 10, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 20 }).default("V").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
});

export const masterFrequencies = mysqlTable("master_frequencies", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    frequencyValue: decimal("frequency_value", { precision: 5, scale: 2 }).notNull(),
    unit: varchar("unit", { length: 10 }).default("Hz").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
});

export const masterApplications = mysqlTable("master_applications", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 100 }).unique().notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
});

/* =====================================================
   PRODUCTS
===================================================== */

export const products = mysqlTable("products", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).notNull(),
    sku: varchar("sku", { length: 100 }).unique().notNull(),
    companyId: varchar("company_id", { length: 36 }).references(() => companies.id, { onDelete: "restrict" }).notNull(),
    summary: text("summary"),
    images: json("images"),
    datasheetUrl: text("datasheet_url"),
    documentUrl: text("document_url"),
    motorTypeId: varchar("motor_type_id", { length: 36 })
        .references(() => motorTypes.id)
        .notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const productSpecs = mysqlTable("product_specs", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

    productId: varchar("product_id", { length: 36 })
        .references(() => products.id, { onDelete: "cascade" })
        .notNull(),

    isAC: boolean("is_ac").default(true).notNull(),

    /* ==========================================
       AC MOTOR FIELDS
    ========================================== */

    acKw: decimal("ac_kw", { precision: 10, scale: 2 }),

    poleId: varchar("pole_id", { length: 36 })
        .references(() => masterPoles.id),

    voltageId: varchar("voltage_id", { length: 36 })
        .references(() => masterVoltages.id),

    frequencyId: varchar("frequency_id", { length: 36 })
        .references(() => masterFrequencies.id),

    acApplicationId: varchar("ac_application_id", { length: 36 })
        .references(() => masterApplications.id),

    totalMotors: decimal("total_motors", { precision: 10, scale: 0 }),

    motorsPerGroup: decimal("motors_per_group", { precision: 10, scale: 0 }),

    /* ==========================================
       DC MOTOR FIELDS
    ========================================== */

    dcArmatureVoltage: decimal("dc_armature_voltage", { precision: 10, scale: 2 }),

    dcKw: decimal("dc_kw", { precision: 10, scale: 2 }),

    dcFieldVoltage: decimal("dc_field_voltage", { precision: 10, scale: 2 }),

    dcFieldCurrent: decimal("dc_field_current", { precision: 10, scale: 2 }),

    dcApplicationId: varchar("dc_application_id", { length: 36 })
        .references(() => masterApplications.id),
});

/* =====================================================
   EQUATION CONFIG (SMART SELECTION ENGINE)
===================================================== */

export const equationConfigs = mysqlTable("equation_configs", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    keyName: varchar("key_name", { length: 100 }).unique().notNull(),
    formulaString: text("formula_string").notNull(),
    constantValue: decimal("constant_value", { precision: 10, scale: 4 }),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

/* =====================================================
   INQUIRIES
===================================================== */

export const inquiries = mysqlTable("inquiries", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

    productId: varchar("product_id", { length: 36 })
        .references(() => products.id, { onDelete: "set null" }),

    customerName: varchar("customer_name", { length: 255 }).notNull(),
    customerEmail: varchar("customer_email", { length: 255 }).notNull(),
    companyName: varchar("company_name", { length: 255 }),
    message: text("message"),

    userSearchInputs: json("user_search_inputs"),
    status: varchar("status", { length: 50 }).default("New").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

/* =====================================================
   MOTOR SELECTION (AC + DC Combined)
===================================================== */

export const motorSelections = mysqlTable("motor_selections", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),

    inquiryId: varchar("inquiry_id", { length: 36 })
        .references(() => inquiries.id, { onDelete: "cascade" }),

    motorTypeId: varchar("motor_type_id", { length: 36 })
        .references(() => motorTypes.id)
        .notNull(),

    // Common Fields
    kw: decimal("kw", { precision: 10, scale: 2 }).notNull(),
    applicationId: varchar("application_id", { length: 36 })
        .references(() => masterApplications.id),

    totalMotors: decimal("total_motors", { precision: 10, scale: 0 }),
    motorsPerGroup: decimal("motors_per_group", { precision: 10, scale: 0 }),

    // AC Specific
    poleId: varchar("pole_id", { length: 36 })
        .references(() => masterPoles.id),

    voltageId: varchar("voltage_id", { length: 36 })
        .references(() => masterVoltages.id),

    frequencyId: varchar("frequency_id", { length: 36 })
        .references(() => masterFrequencies.id),

    // DC Specific
    armVoltage: decimal("arm_voltage", { precision: 10, scale: 2 }),
    fieldVoltage: decimal("field_voltage", { precision: 10, scale: 2 }),
    fieldCurrent: decimal("field_current", { precision: 10, scale: 2 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = mysqlTable("companies", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).unique().notNull(),
    logoUrl: text("logo_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const brands = mysqlTable("brands", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).unique().notNull(),
    iconUrl: text("icon_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const brandCompanies = mysqlTable("brand_companies", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    brandId: varchar("brand_id", { length: 36 }).references(() => brands.id, { onDelete: "cascade" }).notNull(),
    companyId: varchar("company_id", { length: 36 }).references(() => companies.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const series = mysqlTable("series", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: varchar("name", { length: 255 }).unique().notNull(),
    iconUrl: text("icon_url"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export const seriesBrands = mysqlTable("series_brands", {
    id: varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
    seriesId: varchar("series_id", { length: 36 }).references(() => series.id, { onDelete: "cascade" }).notNull(),
    brandId: varchar("brand_id", { length: 36 }).references(() => brands.id, { onDelete: "cascade" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});