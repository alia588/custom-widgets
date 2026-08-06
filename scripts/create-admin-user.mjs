import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const email = process.argv[2] || 'admin@builtbyshah.com';
const password = process.argv[3] || randomBytes(16).toString('hex');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const { error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  // If the user already exists, surface a helpful message without exposing the password.
  if (error.message?.toLowerCase().includes('already been registered')) {
    console.error(`User ${email} already exists. To set a new password, run the SQL:`);
    console.error(`SELECT auth.uid('${email}'); -- then use auth.admin.updateUserById in a script.`);
    process.exit(1);
  }
  console.error('Failed to create user:', error.message);
  process.exit(1);
}

console.log('Admin user created successfully.');
console.log('Email:', email);
console.log('Password:', password);
