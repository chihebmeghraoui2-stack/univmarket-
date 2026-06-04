with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Trouve les imports mal places
bad_imports = """import { eq, and, count, sql, desc, ilike, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable, servicesTable, ordersTable, disputesTable, withdrawalRequestsTable, wilayasTable, reviewsTable, categoriesTable, notificationsTable, passwordResetRequestsTable } from "@workspace/db";
import { requireAdmin } from "../middleware/auth";
import { logger } from "../lib/logger";"""

# Supprime les imports mal places
content = content.replace(bad_imports, "")

with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
