"use server";

import { revalidatePath } from "next/cache";
import {
    announcementSchema,
    AnnouncementSchema,
    ClassSchema,
    ExamSchema,
    StudentSchema,
    SubjectSchema,
    TeacherSchema,
} from "./formValidationSchemas";
import prisma from "./prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

type CurrentState = { success: boolean; error: boolean };

export const createSubject = async (
    currentState: CurrentState,
    data: SubjectSchema
) => {
    try {
        await prisma.subject.create({
            data: {
                name: data.name,
                teachers: {
                    connect: data.teachers.map((teacherId) => ({ id: teacherId })),
                },
            },
        });

        // revalidatePath("/list/subjects")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const updateSubject = async (
    currentState: CurrentState,
    data: SubjectSchema
) => {
    try {
        await prisma.subject.update({
            where: {
                id: data.id,
            },
            data: {
                name: data.name,
                teachers: {
                    set: data.teachers.map((teacherId) => ({ id: teacherId })),
                },
            },
        });

        // revalidatePath("/list/subjects")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const deleteSubject = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        await prisma.subject.delete({
            where: {
                id: parseInt(id),
            },
        });

        // revalidatePath("/list/subjects")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const createClass = async (
    currentState: CurrentState,
    data: ClassSchema
) => {
    try {
    await prisma.class.create({
        data,
    });

    // revalidatePath("/list/class")
    return { success: true, error: false };
    } catch (err) {
    console.log(err);
    return { success: false, error: true };
    }
};

export const updateClass = async (
    currentState: CurrentState,
    data: ClassSchema
) => {
    try {
    await prisma.class.update({
        where: {
        id: data.id,
        },
        data,
    });

    // revalidatePath("/list/class")
    return { success: true, error: false };
    } catch (err) {
    console.log(err);
    return { success: false, error: true };
    }
};

export const deleteClass = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
    await prisma.class.delete({
        where: {
        id: parseInt(id),
        },
    });

    // revalidatePath("/list/class")
    return { success: true, error: false };
    } catch (err) {
    console.log(err);
    return { success: false, error: true };
    }
};

export const createTeacher = async (
    currentState: CurrentState,
    data: TeacherSchema
) => {
    try {
        const clerk = await clerkClient();
        const user = await clerk.users.createUser({
            username: data.username,
            password: data.password,
            firstName: data.name,
            lastName: data.surname,
            publicMetadata: { role: "teacher" },
        });

        await prisma.teacher.create({
        data: {
            id: user.id,
            username: data.username,
            name: data.name,
            surname: data.surname,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address,
            img: data.img || null,
            bloodType: data.bloodType,
            sex: data.sex,
            birthday: data.birthday,
            subjects: {
                connect: data.subjects
                ?.map((subjectId: string) => ({
                    id: parseInt(subjectId),
                }))
                .filter((s) => !isNaN(s.id)),
            },
        },
    });

    // revalidatePath("/list/teacher")
    return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const updateTeacher = async (
    currentState: CurrentState,
    data: TeacherSchema
) => {
    if (!data.id) {
        return { success: false, error: true };
    }

    try {
        const clerk = await clerkClient();
        const user = await clerk.users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "teacher" },
        });

        await prisma.teacher.update({
            where: {
            id: data.id,
        },
        data: {
            ...(data.password !== "" && { password: data.password }),
            username: data.username,
            name: data.name,
            surname: data.surname,
            email: data.email || null,
            phone: data.phone || null,
            address: data.address,
            img: data.img || null,
            bloodType: data.bloodType,
            sex: data.sex,
            birthday: data.birthday,
            subjects: {
                set: data.subjects
                ?.map((subjectId: string) => ({
                    id: parseInt(subjectId),
                }))
                .filter((s) => !isNaN(s.id)),
            },
        },
    });

    // revalidatePath("/list/teacher")
    return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const deleteTeacher = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(id);
        
        await prisma.teacher.delete({
            where: {
                id: id,
            },
        });

        // revalidatePath("/list/teacher")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};


export const createStudent = async (
    currentState: CurrentState,
    data: StudentSchema
) => {
    try {
        const classItem = await prisma.class.findUnique({
            where: { id: data.classId },
            include: { _count: { select: { students: true } } },
        })
        
        if (classItem && classItem.capacity === classItem._count.students) {
            return { success: false, error: true};
        }
        const clerk = await clerkClient();
        const user = await clerk.users.createUser({
            username: data.username,
            password: data.password,
            firstName: data.name,
            lastName: data.surname,
            publicMetadata: { role: "student" },
        });

        await prisma.student.create({
            data: {
                id: user.id,
                username: data.username,
                name: data.name,
                surname: data.surname,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address,
                img: data.img || null,
                bloodType: data.bloodType,
                sex: data.sex,
                birthday: data.birthday,
                gradeId: data.gradeId,
                classId: data.classId,
                parentId: data.parentId,
            },
        });

    // revalidatePath("/list/student")
    return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const updateStudent = async (
    currentState: CurrentState,
    data: StudentSchema
) => {
    if (!data.id) {
        return { success: false, error: true };
    }

    try {
        const clerk = await clerkClient();
        const user = await clerk.users.updateUser(data.id, {
        username: data.username,
        ...(data.password !== "" && { password: data.password }),
        firstName: data.name,
        lastName: data.surname,
        publicMetadata: { role: "teacher" },
        });

        await prisma.student.update({
            where: {
                id: data.id,
            },
            data: {
                ...(data.password !== "" && { password: data.password }),
                username: data.username,
                name: data.name,
                surname: data.surname,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address,
                img: data.img || null,
                bloodType: data.bloodType,
                sex: data.sex,
                birthday: data.birthday,
                gradeId: data.gradeId,
                classId: data.classId,
                parentId: data.parentId,
            },
        });

        // revalidatePath("/list/student")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const deleteStudent = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;
    try {
        const clerk = await clerkClient();
        await clerk.users.deleteUser(id);

        await prisma.student.delete({
            where: {
                id: id,
            },
        });

        // revalidatePath("/list/student")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const createExam = async (
    currentState: CurrentState,
    data: ExamSchema
) => {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    try {
        if (role === "teacher") {
            const teacherLesson = await prisma.lesson.findFirst({
                where: {
                    teacherId: userId!,
                    id: data.lessonId,
                },
            });

            if (!teacherLesson) {
                return { success: false, error: true };
            }
        }

        await prisma.exam.create({
            data: {
                title: data.title,
                startTime: data.startTime,
                endTime: data.endTime,
                lessonId: data.lessonId,
            },
        });

        // revalidatePath("/list/exams")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const updateExam = async (
    currentState: CurrentState,
    data: ExamSchema
) => {
    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    try {
        if (role === "teacher") {
            const teacherLesson = await prisma.lesson.findFirst({
                where: {
                    teacherId: userId!,
                    id: data.lessonId,
            }   ,
            });

            if (!teacherLesson) {
                return { success: false, error: true };
            }
        }

        await prisma.exam.update({
            where: {
                id: data.id
            },
            data: {
                title: data.title,
                startTime: data.startTime,
                endTime: data.endTime,
                lessonId: data.lessonId,
            },
        });

        // revalidatePath("/list/exams")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

export const deleteExam = async (
    currentState: CurrentState,
    data: FormData
) => {
    const id = data.get("id") as string;

    const { userId, sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    try {
        await prisma.exam.delete({
            where: {
                id: parseInt(id),
                ...(role === "teacher" ? { lesson: { teacherId: userId! } } : {}),
            },
        });

        // revalidatePath("/list/exams")
        return { success: true, error: false };
    } catch (err) {
        console.log(err);
        return { success: false, error: true };
    }
};

/**
 * Validates role and enforces Teacher-to-Class data isolation rules
 * Based on your schema: Class has a list of teachers, lessons, and a supervisor
 */
const validateUserAndPermissions = async (targetClassId: number | null | undefined) => {
    const { userId, sessionClaims } = await auth();
    
    if (!userId) {
        throw new Error("Unauthenticated user.");
    }

    const role = (sessionClaims?.metadata as { role?: string })?.role;

    // 1. Block completely unauthorized roles
    if (role !== "admin" && role !== "teacher") {
        throw new Error("Unauthorized access role.");
    }

    // 2. Admins have absolute access (can post global or to any class)
    if (role === "admin") return;

    // 3. Teacher Restrictions
    if (role === "teacher") {
        // Teachers are strictly forbidden from posting global announcements
        if (!targetClassId) {
            throw new Error("Teachers cannot post global announcements. A target class must be specified.");
        }

        // Check if this teacher is assigned to this class OR is the class supervisor
        const formsRelationshipExists = await prisma.class.findFirst({
            where: {
                id: targetClassId,
                OR: [
                        {
                            lessons: {
                                some: {
                                    teacherId: userId,
                                },
                            },
                        },
                    {
                    // Checks if they are the class supervisor
                    supervisorId: userId,
                    }
                ]
            },
        });

        if (!formsRelationshipExists) {
            throw new Error("Unauthorized: You are not assigned to teach or supervise this class.");
        }
    }
};

// 1. CREATE ANNOUNCEMENT ACTION
export const createAnnouncement = async (
    currentState: CurrentState,
    data: AnnouncementSchema
): Promise<CurrentState> => {
    try {
        const validatedData = announcementSchema.parse(data);
    
        // Enforce authorization checks before DB mutations
        await validateUserAndPermissions(validatedData.classId);

        await prisma.announcement.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                date: validatedData.date,
                classId: validatedData.classId || null,
            },
        });

        // revalidatePath("/list/announcements");
        return { success: true, error: false };
    } catch (err) {
        console.error("Create Announcement Error:", err);
        return { success: false, error: true };
    }
};

// 2. UPDATE ANNOUNCEMENT ACTION
export const updateAnnouncement = async (
    currentState: CurrentState,
    data: AnnouncementSchema
): Promise<CurrentState> => {
    try {
        const validatedData = announcementSchema.parse(data);
        if (!validatedData.id) return { success: false, error: true };

        // Enforce validation on the newly targetted class
        await validateUserAndPermissions(validatedData.classId);

        // Additional Check: Ensure a teacher isn't sneaky and editing an announcement they don't own
        const { userId, sessionClaims } = await auth();
        const role = (sessionClaims?.metadata as { role?: string })?.role;

        if (role === "teacher") {
            const existingAnnouncement = await prisma.announcement.findUnique({
                where: { id: validatedData.id },
                select: { classId: true }
            });

            // Verify they also had rights to the original class room announcement
            if (existingAnnouncement?.classId) {
            await validateUserAndPermissions(existingAnnouncement.classId);
            }
        }

        await prisma.announcement.update({
            where: { id: validatedData.id },
            data: {
                title: validatedData.title,
                description: validatedData.description,
                date: validatedData.date,
                classId: validatedData.classId || null,
            },
        });

        // revalidatePath("/list/announcements");
        return { success: true, error: false };
    } catch (err) {
        console.error("Update Announcement Error:", err);
        return { success: false, error: true };
    }
};

