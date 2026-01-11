"use server";

import { cache } from "react";
import { db } from "@/db/drizzle";
import { member, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq, inArray, not } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return {
    ...session,
  };
});

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });

    return {
      success: true,
      message: "Signed in successfully.",
    };
  } catch (error) {
    const e = error as Error;

    // Check if the error is about credential account not found
    if (e.message?.includes("Credential account not found")) {
      // User exists but only has OAuth accounts (Google, etc.)
      return {
        success: false,
        message: "This account was created with Google. Please use 'Login with Google' instead.",
      };
    }

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const signUp = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        email, // required
        password, // required
        name: username, // required
      },
    });

    return {
      success: true,
      message: "Signed up successfully.",
    };
  } catch (error) {
    const e = error as Error;

    return {
      success: false,
      message: e.message || "An unknown error occurred.",
    };
  }
};

export const getUsers = async (organizationId: string) => {
  try {
    const members = await db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
    });

    const users = await db.query.user.findMany({
      where: not(
        inArray(
          user.id,
          members.map((member) => member.userId)
        )
      ),
    });

    return users;
  } catch (error) {
    console.error(error);
    return [];
  }
};
