import os
from sqlalchemy import create_engine, text

# Load DATABASE_URL from .env
db_url = "postgresql://postgres.gaoisxnposygconudgun:WJcGwr8OwAc6XCKb@aws-0-eu-west-1.pooler.supabase.com:6543/postgres"
user_id = "9dd68c7d-8e7c-4b2d-bf76-2c6b7c800d3b"

print("--- Upgrading User Role in Supabase Database ---")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print(f"Connecting to database and updating user ID {user_id}...")
        # Update user role to enterprise
        result = conn.execute(
            text("UPDATE users SET role = 'enterprise' WHERE id = :user_id"),
            {"user_id": user_id}
        )
        conn.commit()
        print(f"✅ Success! Updated {result.rowcount} rows. Role set to 'enterprise'.")
except Exception as e:
    print(f"❌ Failed to update database: {e}")
