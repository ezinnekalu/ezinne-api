-- This is an empty migration.
-- Enable RLS on all your tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Topics" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tips" ENABLE ROW LEVEL SECURITY;

-- ====== USER TABLE POLICIES ======
CREATE POLICY "Allow all operations on users" ON "User"
  FOR ALL USING (true);

-- ====== TOPICS TABLE POLICIES ======
CREATE POLICY "Allow all operations on topics" ON "Topics"
  FOR ALL USING (true);

-- ====== POSTS TABLE POLICIES ======
CREATE POLICY "Allow all operations on posts" ON "Posts"
  FOR ALL USING (true);

-- ====== TIPS TABLE POLICIES ======
CREATE POLICY "Allow all operations on tips" ON "Tips"
  FOR ALL USING (true);