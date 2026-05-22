import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const schemaUrl = new URL('../../supabase/schema-public.sql', import.meta.url);

async function readSchema() {
  return readFile(schemaUrl, 'utf8');
}

describe('Supabase security contract snapshot', () => {
  it('keeps queue SECURITY DEFINER RPCs branch-authorized and off anon grants', async () => {
    const schema = await readSchema();

    expect(schema).toContain('Authentication is required to finish queue games.');
    expect(schema).toContain('Queue transition IDs must belong to the same branch.');
    expect(schema).toContain('public.check_can_edit(current_branch_id)');
    expect(schema).toContain('Only waiting queue entries can be reordered.');
    expect(schema).toContain('public.check_can_edit(qe.branch_id)');
    expect(schema).not.toMatch(/GRANT\s+\w+\s+ON FUNCTION "public"\."finish_game".* TO "anon";/);
    expect(schema).not.toMatch(/GRANT\s+\w+\s+ON FUNCTION "public"\."reorder_queue_entries".* TO "anon";/);
  });

  it('routes public profile reads through filtered models', async () => {
    const schema = await readSchema();

    expect(schema).toContain('CREATE OR REPLACE FUNCTION "public"."get_public_profile_by_slug"');
    expect(schema).toContain('CREATE OR REPLACE VIEW "public"."public_user_profiles"');
    expect(schema).toContain('Profile owners and admins can read profiles');
    expect(schema).not.toContain('CREATE POLICY "Enable read access for all users" ON "public"."user_profiles"');
  });
});
