
import { db } from "./db";
import { sql } from "drizzle-orm";

async function runMigration() {
  console.log("Starting database migration...");
  
  try {
    // Add missing columns to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS bio TEXT,
      ADD COLUMN IF NOT EXISTS status_message VARCHAR(100),
      ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS presence_status VARCHAR DEFAULT 'online',
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR,
      ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE,
      ADD COLUMN IF NOT EXISTS website VARCHAR,
      ADD COLUMN IF NOT EXISTS location VARCHAR,
      ADD COLUMN IF NOT EXISTS language VARCHAR DEFAULT 'en',
      ADD COLUMN IF NOT EXISTS timezone VARCHAR,
      ADD COLUMN IF NOT EXISTS profile_visibility VARCHAR DEFAULT 'everyone',
      ADD COLUMN IF NOT EXISTS last_seen_visibility VARCHAR DEFAULT 'everyone',
      ADD COLUMN IF NOT EXISTS phone_visibility VARCHAR DEFAULT 'contacts',
      ADD COLUMN IF NOT EXISTS email_visibility VARCHAR DEFAULT 'contacts',
      ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS profile_completion_score INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT NOW()
    `);

    // Create new tables for profile features
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_badges (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        badge_type VARCHAR NOT NULL,
        issued_by VARCHAR,
        issued_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_statuses (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT,
        media_url VARCHAR,
        media_type VARCHAR,
        background_color VARCHAR,
        text_color VARCHAR,
        expires_at TIMESTAMP NOT NULL,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS status_views (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        status_id VARCHAR NOT NULL REFERENCES user_statuses(id) ON DELETE CASCADE,
        viewer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_contacts (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        contact_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        nickname VARCHAR,
        is_favorite BOOLEAN DEFAULT false,
        is_blocked BOOLEAN DEFAULT false,
        added_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_activity (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        activity_type VARCHAR NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS profile_views (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewer_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        viewed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("Migration completed successfully!");
    
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log("Database migration completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { runMigration };
