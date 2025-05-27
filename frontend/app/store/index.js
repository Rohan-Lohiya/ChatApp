// store/index.js
"use client"
import { configureStore } from '@reduxjs/toolkit';
import selectedUserReducer from './selectedUserSlice';

export const store = configureStore({
  reducer: {
    selectedUser: selectedUserReducer,
  },
});
