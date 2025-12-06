import bcrypt from "bcrypt";
import { storage } from "./storage";

async function seedAdminUser() {
  const email = "onlinefitprohub@gmail.com";
  const password = "testing1!";
  const role = "admin";
  const subscriptionTier = "scale";

  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      console.log(`User ${email} already exists. Updating to admin/scale...`);
      // Update existing user
      const { db } = await import("./db");
      const { users } = await import("@shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const passwordHash = await bcrypt.hash(password, 12);
      await db
        .update(users)
        .set({ 
          passwordHash, 
          role, 
          subscriptionTier,
          subscriptionStatus: 'active'
        })
        .where(eq(users.email, email));
      
      console.log(`Updated user ${email} with admin role and scale subscription`);
      return;
    }

    // Create new user with hashed password
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await storage.createUserWithPassword(email, passwordHash, role, subscriptionTier);
    
    console.log(`Admin user created successfully:`);
    console.log(`  Email: ${email}`);
    console.log(`  Role: ${role}`);
    console.log(`  Subscription: ${subscriptionTier}`);
    console.log(`  User ID: ${user.id}`);
  } catch (error) {
    console.error("Failed to create admin user:", error);
    process.exit(1);
  }
}

seedAdminUser().then(() => {
  console.log("Seed completed");
  process.exit(0);
}).catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
