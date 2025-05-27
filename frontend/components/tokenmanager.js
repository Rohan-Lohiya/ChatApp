// components/TokenManager.js
'use client';
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useSession } from "next-auth/react";
import { settoken } from "@/app/store/selectedUserSlice";

export default function TokenManager() {
  const { data: session } = useSession();
  const dispatch = useDispatch();

  useEffect(() => {
    if (session?.backendToken) {
      dispatch(settoken(session.backendToken));
    }
  }, [session, dispatch]);

  return null; // This component doesn't render anything
}