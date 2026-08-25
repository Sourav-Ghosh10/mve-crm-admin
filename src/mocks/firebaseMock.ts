import { jest } from '@jest/globals';
export const initializeApp = jest.fn();
export const getAuth = jest.fn(() => ({
    currentUser: null,
}));
export const GoogleAuthProvider = jest.fn();
export const signInWithPopup = jest.fn();
export const signOut = jest.fn();
export const onAuthStateChanged = jest.fn();
