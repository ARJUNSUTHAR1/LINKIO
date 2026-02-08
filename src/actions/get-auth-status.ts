"use server";

import { authOptions } from "@/lib/auth";
import { db } from "@/lib";
import { getServerSession } from "next-auth";

const getAuthStatus = async () => {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return { error: "User not found" };
    }

    const existingUser = await db.user.findUnique({
        where: {
            email: session.user.email,
        },
    });

    if (!existingUser) {
        return { error: "User not found" };
    }

    return { success: true, user: existingUser };
};

export default getAuthStatus;
