import { useState, useEffect } from 'react';

/**
 * Custom hook to manage authentication state and logic.
 */
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_authenticated') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('is_authenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  /**
   * Verifies the access code and logs the user in if correct.
   * @param code The access code entered by the user.
   * @returns boolean indicating if the login was successful.
   */
  const login = (code: string): boolean => {
    if (code.toUpperCase() === 'EDUNOMICS') {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  /**
   * Logs the user out by resetting the authentication state.
   */
  const logout = () => {
    setIsAuthenticated(false);
  };

  return {
    isAuthenticated,
    setIsAuthenticated, // Added for easier integration if needed
    login,
    logout
  };
};

export default useAuth;
