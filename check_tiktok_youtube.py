"""
Check TikTok and YouTube records in database
"""
import psycopg2

# Direct database connection
DATABASE_URL = "postgresql://postgres.vbllagoyotlrxsdmnyxu:comsats0099@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

# Query for TikTok and YouTube specifically
print("\n=== TikTok and YouTube Records ===")
cur.execute("""
    SELECT platform, is_connected, account_id, account_name, created_at, expires_at
    FROM social_accounts
    WHERE platform IN ('tiktok', 'youtube')
    ORDER BY platform
""")

rows = cur.fetchall()

if not rows:
    print("\n❌ No TikTok or YouTube records found in database!")
else:
    print("\n✅ TikTok/YouTube records found:")
    for row in rows:
        platform, is_connected, account_id, account_name, created_at, expires_at = row
        print(f"\n  Platform: {platform}")
        print(f"  is_connected: {is_connected}")
        print(f"  account_id: {account_id}")
        print(f"  account_name: {account_name}")
        print(f"  expires_at: {expires_at}")

# Also check all platforms
print("\n\n=== All platforms in database ===")
cur.execute("""
    SELECT platform, is_connected, account_name
    FROM social_accounts
    ORDER BY platform
""")

for row in cur.fetchall():
    platform, is_connected, account_name = row
    status = "✅" if is_connected else "❌"
    print(f"  {status} {platform}: is_connected={is_connected}, name={account_name}")

cur.close()
conn.close()
