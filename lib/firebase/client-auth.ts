"use client";

import { getAuth, signInWithCustomToken, onAuthStateChanged } from "firebase/auth";

import { getFirebaseApp } from "./client-app";

let signingIn: Promise<void> | null = null;

async function fetchCustomToken() {
  const response = await fetch("/api/firebase/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Unable to retrieve Firebase custom token");
  }

  const data = await response.json();
  return data.token as string;
}

export async function ensureFirebaseSignedIn(): Promise<void> {
  const auth = getAuth(getFirebaseApp());

  if (auth.currentUser) {
    return;
  }

  if (signingIn) {
    return signingIn;
  }

  signingIn = (async () => {
    const token = await fetchCustomToken();
    await signInWithCustomToken(auth, token);
  })().finally(() => {
    signingIn = null;
  });

  return signingIn;
}

export function subscribeToAuthChanges(callback: (signedIn: boolean) => void) {
  const auth = getAuth(getFirebaseApp());
  return onAuthStateChanged(auth, (user) => callback(!!user));
}
