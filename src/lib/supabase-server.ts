import { createServerSupabaseClient as createServerSupabaseClientPages } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@/types/database.types'

import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { type SupabaseClient } from '@supabase/supabase-js';

export const createServerSupabaseClient = (req: NextApiRequest, res: NextApiResponse) =>
  createServerSupabaseClientPages<Database>({ req, res })

// Função para uso em app router (route handlers)
export function createClient(): SupabaseClient<Database> {
  return createRouteHandlerClient<Database>({ cookies });
}
