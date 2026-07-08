import mockDb, { saveToStorage } from '../mockDb.js';
import { setItem, removeItem } from '../../services/storage.js';

/**
 * Authenticates a user with email and password using the local mock database.
 * Saves a mock JWT token and returns the user.
 */
export const login = async (email, password) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const user = mockDb.users.find(u => u.email === email && u.password === password);
  if (!user) {
    throw new Error('Invalid email or password.');
  }

  // Generate fake token
  const token = `mock_token_jwt_${user.id}`;
  setItem('token', token);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Registers a new user inside the local mock database.
 * Saves a mock JWT token and returns the user.
 */
export const register = async (name, email, password, role) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  const emailCheck = mockDb.users.some(u => u.email === email);
  if (emailCheck) {
    throw new Error('Email already exists.');
  }

  const newId = mockDb.users.reduce((max, u) => Math.max(max, u.id), 0) + 1;
  const avatar = 'initials';
  const themeColor = role === 'teacher' ? 'emerald' : 'indigo';

  const newUser = {
    id: newId,
    email,
    password,
    name,
    role,
    avatar,
    themeColor,
    enrolledCourses: role === 'student' ? [1, 2, 3] : []
  };

  mockDb.users.push(newUser);
  saveToStorage(mockDb);

  const token = `mock_token_jwt_${newId}`;
  setItem('token', token);

  const { password: _, ...userWithoutPassword } = newUser;
  return userWithoutPassword;
};

/**
 * Updates a mock user's profile details.
 */
export const updateUserProfile = async (userId, name, password, avatar, themeColor) => {
  await new Promise(resolve => setTimeout(resolve, 300));

  const userIndex = mockDb.users.findIndex(u => u.id === Number(userId));
  if (userIndex === -1) {
    throw new Error('User not found.');
  }

  const user = mockDb.users[userIndex];
  if (name !== undefined) user.name = name;
  if (password) user.password = password;
  if (avatar) user.avatar = avatar;
  if (themeColor) user.themeColor = themeColor;

  saveToStorage(mockDb);

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

/**
 * Logs out the user by removing items.
 */
export const logout = () => {
  removeItem('token');
  removeItem('user');
};
