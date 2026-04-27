# Supabase Database Setup

## Files
- `schema.sql` - Main database schema (tables, policies, triggers, indexes)
- `seed.sql` - Optional seed data for testing

## Setup Instructions

### Method 1: Using Supabase Dashboard
1. Go to your Supabase project
2. Navigate to **Database** → **SQL Editor**
3. Click **New Query**
4. Copy the contents of `schema.sql`
5. Click **Run**

### Method 2: Using Supabase CLI
```bash
# Install Supabase CLI if not already installed
# Then run the schema
supabase db run schema.sql
```

### Method 3: Using psql
```bash
psql -h <your-project-ref>.supabase.co -U postgres -d postgres -f schema.sql
```

### Optional: Seed Data
After running schema.sql, optionally run seed.sql for test data:
```bash
# In SQL Editor, run seed.sql contents
```

## Important Notes

### Auth.users Table
The `auth.users` table is managed by Supabase Auth automatically. 
- Do NOT create or modify it manually
- Do NOT enable RLS on auth.users
- The `profiles` table references auth.users via foreign key

### Row Level Security (RLS)
All public tables have RLS enabled. Policies ensure:
- Users can only access their own data
- Public notes are viewable by everyone
- Proper authorization checks on all operations

### Storage
Supabase Storage buckets are automatically created:
- `avatars` - for user profile pictures
- `documents` - for uploaded study files

### Extensions
Required PostgreSQL extensions:
- `uuid-ossp` - for UUID generation

## Migration Strategy

For future schema changes, use Supabase's migration system:

```bash
# Create a new migration
supabase migration new add_new_feature

# Write your SQL in the generated file
# Then apply it
supabase db push
```

## API Usage Examples

### Get user profile with notes
```sql
SELECT 
  p.username,
  p.full_name,
  n.title,
  n.content
FROM profiles p
JOIN notes n ON n.user_id = p.id
WHERE p.id = 'user-uuid';
```

### Create a new study session
```sql
INSERT INTO study_sessions (user_id, title, description)
VALUES ('user-uuid', 'New Session', 'Description');
```

### Update reading progress
```sql
INSERT INTO reading_progress (user_id, note_id, progress_percent, last_position)
VALUES ('user-uuid', 'note-uuid', 50, 2000)
ON CONFLICT (user_id, note_id) 
DO UPDATE SET 
  progress_percent = EXCLUDED.progress_percent,
  last_position = EXCLUDED.last_position,
  updated_at = now();
```

## Troubleshooting

### Error: "must be owner of table users"
This happens when trying to enable RLS on `auth.users`. 
**Solution**: Don't modify RLS on auth.users - it's managed by Supabase.

### Error: "relation auth.users does not exist"
**Solution**: Ensure Supabase Auth is enabled in your project settings.

### RLS blocking access
If you can't access your data:
1. Check you're authenticated (JWT token valid)
2. Verify RLS policies match your query
3. Use `security definer` functions for complex operations

## Database Architecture

```
profiles (users)
  ↓
  ├─ study_sessions
  │    ├─ files
  │    └─ timer_logs
  │
  ├─ notes
  │    ├─ note_sections
  │    ├─ note_tags
  │    ├─ flashcards
  │    ├─ reading_progress
  │    └─ quiz_results
  │
  └─ storage (via Supabase Storage)
```

## Performance Tips

1. **Use indexes**: All foreign keys are indexed
2. **Limit queries**: Use pagination for large datasets
3. **Enable caching**: Use Supabase's built-in caching
4. **Batch operations**: Group related writes
5. **Realtime**: Use Supabase Realtime for live updates

## Security Best Practices

1. Always use parameterized queries
2. Never expose service role keys client-side
3. Use RLS policies for all data access
4. Validate all user input
5. Use stored procedures for complex logic
6. Regular backup: Enable Point-in-Time Recovery
7. Audit logs: Enable Database Audit Logging

## Support

For issues or questions, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
