"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import InputField from "../InputField";
import { announcementSchema, AnnouncementSchema } from "@/lib/formValidationSchemas";
import { createAnnouncement, updateAnnouncement } from "@/lib/actions";
import { Dispatch, SetStateAction, startTransition, useActionState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const AnnouncementForm = ({
    type,
    data,
    setOpen,
    relatedData,
}: {
    type: "create" | "update";
    data?: any;
    setOpen: Dispatch<SetStateAction<boolean>>;
    relatedData?: any;
}) => {
    const { classes } = relatedData || { classes: [] };
    const router = useRouter();

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AnnouncementSchema>({
        resolver: zodResolver(announcementSchema) as any,
        defaultValues: {
            id: data?.id,
            title: data?.title || "",
            description: data?.description || "",
            date: data?.date ? new Date(data.date) : undefined,
            classId: data?.classId || "",
        },
    });

    const [state, formAction] = useActionState(
        type === "create" ? createAnnouncement : updateAnnouncement,
        { success: false, error: false }
    );

    const onSubmit = handleSubmit((formData) => {
        startTransition(() => {
            formAction(formData);
        });
    });

    useEffect(() => {
        if (state.success) {
            toast(`Announcement has been ${type === "create" ? "created" : "updated"}!`);
            setOpen(false);
            router.refresh();
        }
    }, [state, router, type, setOpen]);

    return (
        <form className="flex flex-col gap-8" onSubmit={onSubmit}>
            <h1 className="text-xl font-semibold">
                {type === "create" ? "Create a new announcement" : "Update the announcement"}
            </h1>

            <div className="flex justify-between flex-wrap gap-4">
                <InputField
                    label="Announcement Title"
                    name="title"
                    defaultValue={data?.title}
                    register={register}
                    error={errors?.title}
                />

                {data && (
                    <InputField
                        label="Id"
                        name="id"
                        defaultValue={data?.id}
                        register={register}
                        error={errors?.id}
                        hidden
                    />
                )}

                <InputField
                    label="Display Date"
                    name="date"
                    type="date"
                    defaultValue={data?.date ? new Date(data.date).toISOString().split("T")[0] : ""}
                    register={register}
                    error={errors?.date}
                />

                <div className="flex flex-col gap-2 w-full md:w-1/4">
                    <label className="text-xs text-gray-500">Target Class (Optional)</label>
                    <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("classId")}
                        defaultValue={data?.classId || ""}
                    >
                        <option value="">All Classes (General Announcement)</option>
                        {classes?.map((c: { id: number; name: string }) => (
                            <option value={c.id} key={c.id}>
                                {c.name}
                            </option>
                        ))}
                    </select>
                    {errors.classId?.message && (
                        <p className="text-xs text-red-400">{errors.classId.message.toString()}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                    <label className="text-xs text-gray-500">Description</label>
                    <textarea
                        rows={4}
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("description")}
                        defaultValue={data?.description || ""}
                    />
                    {errors.description?.message && (
                        <p className="text-xs text-red-400">{errors.description.message.toString()}</p>
                    )}
                </div>
            </div>

            {state.error && <span className="text-red-500">Something went wrong or unauthorized!</span>}

            <button className="bg-blue-400 text-white p-2 rounded-md">
                {type === "create" ? "Create" : "Update"}
            </button>
        </form>
    );
};

export default AnnouncementForm;
