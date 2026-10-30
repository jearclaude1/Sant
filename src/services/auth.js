// Authentication Service for Santa Columbus Apartments MIS
import { saveUserToFirebase, fetchUsersFromFirebase } from './firebase';

const CURRENT_USER_KEY = 'santa_columbus_current_user';
const USERS_LIST_KEY = 'santa_columbus_registered_users';

// Pre-seeded demo staff users
const DEFAULT_USERS = [
  {
    username: 'MIS Officer',
    telephone: '0788123456',
    password: 'password123',
    verified: true,
    registeredAt: '2026-10-01T08:00:00.000Z'
  },
  {
    username: 'Property Manager',
    telephone: '0788999888',
    password: 'admin',
    verified: true,
    registeredAt: '2026-10-01T08:00:00.000Z'
  }
];

// Get all registered users from local cache + pre-seeds
export const getLocalRegisteredUsers = () => {
  try {
    const raw = localStorage.getItem(USERS_LIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading registered users from localStorage', e);
  }
  // Initialize with defaults
  localStorage.setItem(USERS_LIST_KEY, JSON.stringify(DEFAULT_USERS));
  return DEFAULT_USERS;
};

// Save registered users list locally
export const saveLocalRegisteredUsers = (users) => {
  try {
    localStorage.setItem(USERS_LIST_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving registered users to localStorage', e);
  }
};

// Retrieve currently active logged-in user
export const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Error reading current user', e);
  }
  return null;
};

// Set logged-in user
export const setCurrentUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  } catch (e) {
    console.error('Error storing current user', e);
  }
};

// Log out user
export const logoutUser = () => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

export const formatDisplayPhone = (phone) => {
  const digits = (phone || '').replace(/[^0-9]/g, '');
  const intl = digits.startsWith('07') && digits.length === 10
    ? `250${digits.slice(1)}`
    : digits.startsWith('7') && digits.length === 9
      ? `250${digits}`
      : digits;
  if (intl.startsWith('250') && intl.length === 12) {
    return `+250 ${intl.slice(3, 6)} ${intl.slice(6, 9)} ${intl.slice(9)}`;
  }
  return phone;
};

// Generate 6-digit numeric verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Initiate user registration (returns verification code for verification step)
export const initiateRegistration = async ({ username, telephone, password }) => {
  const cleanPhone = (telephone || '').trim().replace(/\s+/g, '');
  const cleanUsername = (username || '').trim();

  if (!cleanUsername) {
    throw new Error('Please enter your username');
  }
  if (!cleanPhone) {
    throw new Error('Please enter your telephone number');
  }
  if (!password || password.length < 4) {
    throw new Error('Password must be at least 4 characters long');
  }

  const existingUsers = getLocalRegisteredUsers();
  const phoneExists = existingUsers.some(
    (u) => u.telephone.replace(/\s+/g, '') === cleanPhone
  );

  if (phoneExists) {
    throw new Error('This telephone number is already registered. Please log in.');
  }

  // Generate 6-digit verification code
  const verificationCode = generateVerificationCode();

  const pendingUser = {
    username: cleanUsername,
    telephone: cleanPhone,
    password: password,
    verificationCode: verificationCode,
    initiatedAt: Date.now()
  };

  return {
    success: true,
    verificationCode,
    pendingUser
  };
};

// Generate a replacement code for the in-app verification popup.
export const resendVerificationCode = async ({ pendingUser }) => {
  if (!pendingUser) {
    throw new Error('No pending registration session found.');
  }

  const newCode = generateVerificationCode();
  const updatedPending = {
    ...pendingUser,
    verificationCode: newCode,
    initiatedAt: Date.now()
  };

  return {
    success: true,
    verificationCode: newCode,
    pendingUser: updatedPending
  };
};

// Complete verification and save user
export const verifyAndCompleteRegistration = async ({ pendingUser, enteredCode }) => {
  if (!pendingUser) {
    throw new Error('No pending registration found. Please try again.');
  }

  const cleanEntered = (enteredCode || '').trim();
  if (cleanEntered !== pendingUser.verificationCode) {
    throw new Error('Invalid verification code. Please check and try again.');
  }

  const verifiedUser = {
    username: pendingUser.username,
    telephone: pendingUser.telephone,
    password: pendingUser.password,
    verified: true,
    registeredAt: new Date().toISOString()
  };

  // 1. Save locally
  const currentUsers = getLocalRegisteredUsers();
  const updatedUsers = [verifiedUser, ...currentUsers.filter(u => u.telephone !== verifiedUser.telephone)];
  saveLocalRegisteredUsers(updatedUsers);

  // 2. Persist to Firebase Realtime Database
  try {
    await saveUserToFirebase(verifiedUser);
  } catch (err) {
    console.warn('Firebase user sync note:', err.message);
  }

  // 3. Automatically log in user
  setCurrentUser(verifiedUser);

  return {
    success: true,
    user: verifiedUser
  };
};

// User Login function
export const loginUser = async ({ identifier, password }) => {
  const cleanIdentifier = (identifier || '').trim().toLowerCase().replace(/\s+/g, '');
  const cleanPassword = (password || '');

  if (!cleanIdentifier) {
    throw new Error('Please enter your telephone number or username');
  }
  if (!cleanPassword) {
    throw new Error('Please enter your password');
  }

  // Try loading latest users from Firebase if available
  let allUsers = getLocalRegisteredUsers();
  try {
    const cloudUsers = await fetchUsersFromFirebase();
    if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
      // Merge with local
      const mergedMap = new Map();
      allUsers.forEach(u => mergedMap.set(u.telephone, u));
      cloudUsers.forEach(u => mergedMap.set(u.telephone, u));
      allUsers = Array.from(mergedMap.values());
      saveLocalRegisteredUsers(allUsers);
    }
  } catch (e) {
    // offline or firebase restricted
  }

  const matchedUser = allUsers.find((u) => {
    const userPhone = (u.telephone || '').trim().toLowerCase().replace(/\s+/g, '');
    const userName = (u.username || '').trim().toLowerCase();
    const idMatches = userPhone === cleanIdentifier || userName === cleanIdentifier;
    return idMatches && u.password === cleanPassword;
  });

  if (!matchedUser) {
    throw new Error('Invalid telephone/username or password. Please try again.');
  }

  // Set current user
  setCurrentUser(matchedUser);

  return {
    success: true,
    user: matchedUser
  };
};
