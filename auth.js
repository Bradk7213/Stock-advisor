// api/auth.js - User authentication endpoints
import { createClient } from '@supabase/supabase-js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const JWT_SECRET = process.env.JWT_SECRET;

// Sign up new user
async function signUp(email, password, fullName) {
  try {
    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcryptjs.hash(password, 10);

    // Create team for new user
    const { data: team, error: teamError } = await supabase
      .from('teams')
      .insert({
        name: `${fullName}'s Team`
      })
      .select()
      .single();

    if (teamError) throw teamError;

    // Create user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        full_name: fullName,
        team_id: team.id
      })
      .select()
      .single();

    if (userError) throw userError;

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        teamId: user.team_id
      },
      token
    };

  } catch (error) {
    throw new Error(`Sign up failed: ${error.message}`);
  }
}

// Log in existing user
async function logIn(email, password) {
  try {
    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (userError || !user) {
      throw new Error('User not found');
    }

    // Check password
    const isValidPassword = await bcryptjs.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new Error('Invalid password');
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        teamId: user.team_id
      },
      token
    };

  } catch (error) {
    throw new Error(`Log in failed: ${error.message}`);
  }
}

// Get team members
async function getTeamMembers(teamId) {
  try {
    const { data: members, error } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('team_id', teamId);

    if (error) throw error;
    return members || [];

  } catch (error) {
    throw new Error(`Get team members failed: ${error.message}`);
  }
}

// Add team member
async function addTeamMember(teamId, email) {
  try {
    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) {
      throw new Error('User not found. They must sign up first.');
    }

    // Update user's team
    const { error } = await supabase
      .from('users')
      .update({ team_id: teamId })
      .eq('id', user.id);

    if (error) throw error;
    return { message: 'User added to team' };

  } catch (error) {
    throw new Error(`Add team member failed: ${error.message}`);
  }
}

// Verify JWT token
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export default async function handler(req, res) {
  const { action, email, password, fullName, teamId, token } = req.body;

  try {
    if (action === 'signup') {
      const result = await signUp(email, password, fullName);
      return res.status(200).json(result);
    }

    if (action === 'login') {
      const result = await logIn(email, password);
      return res.status(200).json(result);
    }

    if (action === 'verify-token') {
      const decoded = verifyToken(token);
      return res.status(200).json({ valid: true, user: decoded });
    }

    if (action === 'team-members') {
      const members = await getTeamMembers(teamId);
      return res.status(200).json({ members });
    }

    if (action === 'add-member') {
      const result = await addTeamMember(teamId, email);
      return res.status(200).json(result);
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}
