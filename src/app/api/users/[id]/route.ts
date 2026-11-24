import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser, isAdmin } from "@/lib/api-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

const updateUserSchema = z.object({
    name: z.string().trim().min(2).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    role: z.enum(["SUPERADMIN", "OWNER", "STAFF"]).optional(),
    profile: z.object({
        initials: z.string().trim().max(4).optional(),
        avatarColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
        title: z.string().trim().max(100).optional(),
        isAvailable: z.boolean().optional(),
    }).optional(),
    permissions: z.array(z.object({
        module: z.enum(["DASHBOARD", "INBOX", "CONTACTS", "CRM", "STUDENTS", "AI", "REPORTS", "AUTOMATION", "BROADCAST", "SESSIONS", "SETTINGS", "USERS", "INTEGRATIONS"]),
        action: z.enum(["VIEW", "CREATE", "UPDATE", "DELETE", "MANAGE"]),
    })).max(70).optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser(request);

    // Only SUPERADMIN can update users
    if (!user || !isAdmin(user.role)) {
        return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    try {
        const parsed = updateUserSchema.safeParse(await request.json().catch(() => ({})));
        if (!parsed.success) {
            return NextResponse.json({ status: false, error: "Dados de usuário inválidos" }, { status: 400 });
        }
        const { name, email, password, role, profile, permissions } = parsed.data;

        // Prevent modifying own role to lock oneself out (optional safety)
        if (id === user.id && role && role !== "SUPERADMIN") {
            // Allow update but maybe warn? For now let it be.
        }

        const updateData: Prisma.UserUpdateInput = {};
        if (name) updateData.name = name;
        if (email) updateData.email = email;
        if (role) updateData.role = role;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.$transaction(async (tx) => {
            if (permissions) {
                await tx.userPermission.deleteMany({ where: { userId: id } });
            }
            return tx.user.update({
                where: { id },
                data: {
                    ...updateData,
                    ...(profile ? { profile: { upsert: { create: profile, update: profile } } } : {}),
                    ...(permissions ? { permissions: { createMany: { data: permissions } } } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    updatedAt: true,
                    profile: true,
                    permissions: { select: { module: true, action: true } },
                }
            });
        });

        return NextResponse.json({ status: true, message: "User updated successfully", data: updatedUser });

    } catch (error) {
        console.error("Update user error:", error);
        return NextResponse.json({ status: false, message: "Failed to update user", error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthenticatedUser(request);

    // Only SUPERADMIN can delete users
    if (!user || !isAdmin(user.role)) {
        return NextResponse.json({ status: false, message: "Unauthorized", error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    if (id === user.id) {
        return NextResponse.json({ status: false, message: "Cannot delete yourself", error: "Cannot delete yourself" }, { status: 400 });
    }

    try {
        await prisma.user.delete({ where: { id } });
        return NextResponse.json({ status: true, message: "User deleted successfully" });
    } catch (error) {
        console.error("Delete user error:", error);
        return NextResponse.json({ status: false, message: "Failed to delete user", error: "Failed to delete user" }, { status: 500 });
    }
}
