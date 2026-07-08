import config from '../services/config';
import { apiFetch } from '../services/apiClient';
import { setItem, removeItem } from '../services/storage';
import * as mockAuth from './mock/authService';

/**
 * Authenticates a user with email and password via the Express API or local mock.
 * Saves the returned JWT token to storage and returns the user payload.
 */
export const login = async (email, password) => {
  if (!config.USE_SERVER_API) {
    return mockAuth.login(email, password);
  }

  const response = await apiFetch('/auth/login', {
    method: 'POST',
    body: { email, password }
  });

  const { token, ...user } = response;
  
  // Persist token in storage
  setItem('token', token);
  
  return user;
};

/**
 * Registers a new user via the Express API or local mock.
 * Saves the returned JWT token to storage and returns the user payload.
 */
export const register = async (name, email, password, role) => {
  if (!config.USE_SERVER_API) {
    return mockAuth.register(name, email, password, role);
  }

  const response = await apiFetch('/auth/register', {
    method: 'POST',
    body: { name, email, password, role }
  });

  const { token, ...user } = response;

  // Persist token in storage
  setItem('token', token);

  return user;
};

/**
 * Updates an existing user's profile details.
 * Returns the updated user object.
 */
export const updateUserProfile = async (userId, name, password, avatar, themeColor) => {
  if (!config.USE_SERVER_API) {
    return mockAuth.updateUserProfile(userId, name, password, avatar, themeColor);
  }

  const body = { name, avatar, themeColor };
  if (password) body.password = password;

  const user = await apiFetch(`/auth/profile/${userId}`, {
    method: 'PUT',
    body
  });

  return user;
};

/**
 * Logs out the user by clearing the JWT token and user details from storage.
 */
export const logout = () => {
  if (!config.USE_SERVER_API) {
    return mockAuth.logout();
  }

  removeItem('token');
  removeItem('user');
  
  // Defensive cleanup of any legacy or manually-created un-prefixed storage keys
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {
    // Ignore storage block errors
  }
};

