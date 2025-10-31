import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function createUserDoc(userId: string, email: string) {
  const userRef = doc(db, "users", userId);

  // Default profile data
  const defaultData = {
    email,
    role: "member",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    professionalProfile: {
      fullName: "",
      headline: "New to CCPROS",
      bio: "",
      skills: [],
      education: [],
      experience: [],
    },

    personalProfile: {
      avatarUrl: "/default-avatar.png", // Placeholder image path
      bannerUrl: "/default-banner.png",
      interests: [],
      location: "",
      about: "",
    },

    settings: {
      visibility: "public",
      notifications: {
        email: true,
        push: true,
      },
    },
  };

  await setDoc(userRef, defaultData, { merge: true });
}
