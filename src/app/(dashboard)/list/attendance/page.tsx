import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { Attendance, Class, Lesson, Prisma, Student } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { ITEM_PER_PAGE } from "@/lib/settings";
import { auth } from "@clerk/nextjs/server";
import Image from "next/image";

// const { userId, sessionClaims } = await auth();
// const role = (sessionClaims?.metadata as { role?: string })?.role;
// const currentUserId = userId;

type AttendanceList = Attendance & {
    student: Student & {
        class: Class;
        attendances: Attendance[];
    };
    lesson: Lesson;
    class?: Class;
    percentage?: string;
};

const AttendanceListPage = async ({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) => {
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as { role?: string })?.role;

    const columns = [
        {
            header: "Info",
            accessor: "info"
        },
        {
            header: "Student ID",
            accessor: "studentId",
            className: "hidden md:table-cell",
        },
        {
            header: "Status",
            accessor: "present",
            className: "hidden md:table-cell",
        },
        {
            header: "Attendance Rate",
            accessor: "percentage",
            className: "hidden md:table-cell",
        },
        {
            header: "Date",
            accessor: "date",
            className: "hidden md:table-cell",
        },
        ...(role === "admin"
            ? [
                {
                    header: "Actions",
                    accessor: "action",
                },
            ]
            : []),
    ];

    const renderRow = (item: AttendanceList) => (
        <tr
            key={item.id}
            className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lopeRoseLight"
        >
            <td className="flex items-center gap-4 p-4">
                <Image
                    src={item.student?.img || "/noAvatar.png"}
                    alt=""
                    width={40}
                    height={40}
                    className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
                />
                <div className="flex flex-col">
                    <h3 className="font-semibold">{item.student?.name}</h3>
                    <p className="text-xs text-gray-500">{item.class?.name || "No Class"}</p>
                </div>
            </td>
            <td className="hidden md:table-cell">{item.studentId}</td>
            <td className="hidden md:table-cell">
                <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.present
                            ? "bg-lopeAmberLight text-green-700 border border-green-300"
                            : "bg-lopeRose text-red-700 border border-red-300"
                        }`
                    }
                >
                    {item.present ? "Present" : "Absent"}
                </span>
            </td>
            <td className="hidden md:table-cell font-medium">
                <span
                    className={
                        Number(item.percentage) < 75
                            ? "text-red-600 font-bold"
                            : "text-gray-700"
                    }
                >
                    {item.percentage}%
                </span>
            </td>
            <td className="hidden md:table-cell">
                {new Intl.DateTimeFormat("en-UK").format(new Date(item.date))}
            </td>
            <td>
                <div className="flex items-center gap-2">
                    {(role === "admin" || role === "teacher") && (
                        <>
                            <FormContainer table="attendance" type="update" data={item} />
                            <FormContainer table="attendance" type="delete" id={item.id} />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );

    const { page, ...queryParams } = await searchParams;

    const p = page ? parseInt(page) : 1;

    // URL PARAMS CONDITION

    const query: Prisma.AttendanceWhereInput = {};

    if (queryParams) {
        for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                switch (key) {
                    case "lessonId":
                        query.lesson = {
                            id: parseInt(value),
                        };
                        break;
                    case "classId":
                        query.student = {
                            classId: parseInt(value),
                        };
                        break;
                    case "search":
                        query.student = {
                            name: { contains: value, mode: "insensitive" }
                        };
                        break;
                    default:
                        break;
                }
            }
        }
    }

    const [raw_data, count] = await prisma.$transaction([
        prisma.attendance.findMany({
            where: query,
            include: {
                lesson: true,
                student: {
                    include: {
                        class: true,
                        attendances: true,
                    },
                },
            },
            take: ITEM_PER_PAGE,
            skip: ITEM_PER_PAGE * (p - 1),
            orderBy: {
                date: "desc",
            },
        }),
        prisma.attendance.count({ where: query }),
    ]);

    const data: AttendanceList[] = raw_data.map((item) => {
        const totalRecords = item.student?.attendances?.length || 0;
        const presentRecords = item.student?.attendances?.filter((a) => a.present).length || 0;

        const percentage = totalRecords > 0
            ? Math.round((presentRecords / totalRecords) * 100).toString()
            : "0";

        return {
            ...item,
            student: item.student,
            lesson: item.lesson,
            class: item.student?.class || null,
            percentage,
        };
    }) as unknown as AttendanceList[];

    return (
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
            {/* TOP */}
            <div className="flex items-center justify-between">
                <h1 className="hidden md:block text-lg font-semibold">All Attendance</h1>
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <TableSearch />
                    <div className="flex items-center gap-4 self-end">
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lopeAmber" title="filterBtn">
                            <Image src="/filter.png" alt="" width={14} height={14} />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lopeAmber" title="sortBtn">
                            <Image src="/sort.png" alt="" width={14} height={14} />
                        </button>
                        {role === "admin" && (
                            // <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lopeAmber" title="createStudent">
                            //     <Image src="/create.png" alt="" width={14} height={14} />
                            // </button>
                            <FormContainer table="student" type="create" />
                        )}
                    </div>
                </div>
            </div>
            {/* LIST */}
            <Table columns={columns} renderRow={renderRow} data={data} />
            {/* PAGINATION */}
            <Pagination page={p} count={count} />
        </div>
    );
};

export default AttendanceListPage;