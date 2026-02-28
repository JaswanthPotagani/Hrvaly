import { auth } from "@/auth";
import { db } from "@/lib/prisma";

export const checkUser = async (skipDB = false) => {
    const session = await auth();
    
    if (!session || !session.user || !session.user.email) {
        return null;
    }

    // Fast path: Return session data without DB query
    if (skipDB) {
        return {
            id: session.user.id,
            email: session.user.email,
            plan: session.user.plan,
            // Session contains cached data from JWT token
        };
    }

    // Slow path: Full user fetch from database
    try {
        const user = await db.user.findUnique({
            where: {
                email: session.user.email,
            },
        });
        
        if (user) {
            // Sanitize user object (remove password hash)
            delete user.password;
        }
        
        return user;
    } catch (error) {
        console.error("Error fetching user:", error);
        return null; 
    }
};