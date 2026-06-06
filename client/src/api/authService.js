import { apiFetch } from '../services/apiClient';
import { setItem, removeItem } from '../services/storage';

/**
 * Authenticates a user with email and password via the Express API.
 * Saves the returned JWT token to storage and returns the user payload.
 */
export const login = async (email, password) => {
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
 * Registers a new user.
 * Saves the returned JWT token to storage and returns the user payload.
 */
export const register = async (name, email, password, role) => {
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
  const user = await apiFetch(`/auth/profile/${userId}`, {
    method: 'PUT',
    body: { name, password, avatar, themeColor }
  });

  return user;
};

/**
 * Logs out the user by clearing the JWT token and user details from storage.
 */
export const logout = () => {
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
