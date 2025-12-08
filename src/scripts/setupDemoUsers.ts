import bcrypt from 'bcryptjs';
import { supabase } from '../database/connection';

/**
 * Setup demo users with properly hashed PINs
 * Run this script to create users that can actually log in
 */
async function setupDemoUsers() {
  console.log('Setting up demo users...');

  // Hash PINs
  const adminPinHash = await bcrypt.hash('1234', 10);
  const userPinHash = await bcrypt.hash('5678', 10);
  const demoPinHash = await bcrypt.hash('1234', 10);

  const demoUsers = [
    {
      id: 'user_admin',
      name: 'Admin User',
      email: 'admin@election.com',
      phone: '+1234567890',
      pin_hash: adminPinHash,
      is_admin: true,
    },
    {
      id: 'user_demo',
      name: 'Demo User',
      email: 'user@example.com',
      phone: '+1987654321',
      pin_hash: userPinHash,
      is_admin: false,
    },
    {
      id: 'user_1',
      name: 'Amaka Johnson',
      email: 'amaka.johnson@email.com',
      phone: '+2348012345678',
      pin_hash: demoPinHash,
      is_admin: false,
    },
    {
      id: 'user_2',
      name: 'Kwame Mensah',
      email: 'kwame.mensah@email.com',
      phone: '+233201234567',
      pin_hash: demoPinHash,
      is_admin: false,
    },
    {
      id: 'user_3',
      name: 'Fatima Adeyemi',
      email: 'fatima.adeyemi@email.com',
      phone: '+2348087654321',
      pin_hash: demoPinHash,
      is_admin: false,
    },
    {
      id: 'user_4',
      name: 'Chidi Okafor',
      email: 'chidi.okafor@email.com',
      phone: '+2347012345678',
      pin_hash: demoPinHash,
      is_admin: false,
    },
  ];

  for (const user of demoUsers) {
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existing) {
      // Update existing user
      const { error } = await supabase
        .from('users')
        .update({
          pin_hash: user.pin_hash,
          is_admin: user.is_admin,
        })
        .eq('id', user.id);

      if (error) {
        console.error(`Failed to update user ${user.email}:`, error);
      } else {
        console.log(`✓ Updated user: ${user.email}`);
      }
    } else {
      // Insert new user
      const { error } = await supabase.from('users').insert(user);

      if (error) {
        console.error(`Failed to create user ${user.email}:`, error);
      } else {
        console.log(`✓ Created user: ${user.email}`);
      }
    }
  }

  console.log('\nDemo users setup complete!');
  console.log('\nLogin credentials:');
  console.log('Admin: admin@election.com / PIN: 1234');
  console.log('User: user@example.com / PIN: 5678');
  console.log('Demo users: Use email / PIN: 1234');
}

// Run if called directly
if (require.main === module) {
  setupDemoUsers()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export { setupDemoUsers };

