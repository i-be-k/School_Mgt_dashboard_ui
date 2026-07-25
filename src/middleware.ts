import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

// 1. Transform your settings map into compiled regular expressions once on startup
const parsedRouteRules = Object.entries(routeAccessMap).map(([routePattern, allowedRoles]) => {
    const regexString = routePattern
    .replace(/\(\.\*\)/g, ".*") // Normalize (.*) wildcards
    .replace(/\*/g, ".*");       // Convert lone wildcards to .*

    return {
    regex: new RegExp(`^${regexString}$`),
    allowedRoles,
    };
});

// 2. Extract a clean list of all roles declared in your system settings
const allKnownRoles = Array.from(new Set(Object.values(routeAccessMap).flat()));

export default clerkMiddleware(async (auth, req) => {
    const currentPath = req.nextUrl.pathname;
    const { sessionClaims } = await auth();
    
  // Safely extract the role from user metadata
    const role = (sessionClaims?.metadata as { role?: string })?.role;

  // --- HARD PRIVILEGE ISOLATION GUARD ---
    if (role) {
    // Check if user is trying to access a path belonging to a DIFFERENT role
    // Example: user is 'student', but current path starts with '/teacher' or '/admin'
    const targetOtherRole = allKnownRoles.find(
        (otherRole) => otherRole !== role && currentPath.startsWith(`/${otherRole}`)
    );

    if (targetOtherRole) {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
    }
    }

  // --- STANDARD DYNAMIC ROUTE ACCESS CHECKS ---
    const matchingRule = parsedRouteRules.find((rule) => rule.regex.test(currentPath));

    if (matchingRule) {
    // Redirect if the role is missing or not authorized for this specific route
    if (!role || !matchingRule.allowedRoles.includes(role)) {
        const fallbackRedirect = role ? `/${role}` : "/sign-in"; 
        return NextResponse.redirect(new URL(fallbackRedirect, req.url));
    }
    }
});

export const config = {
     matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    ],
};
