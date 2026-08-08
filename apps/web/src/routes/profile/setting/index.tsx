import { Button } from "#/components/ui/button";
import { Field } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { updateAvatar } from "#/api/profile";

export const Route = createFileRoute("/profile/setting/")({
    component: RouteComponent,
});

function RouteComponent() {
    const [selectedFile, setSelectedFile] = useState<any | null>();
    const uploadAvatarMutation = useMutation({
        mutationFn: updateAvatar,
    });
    const previewImg = selectedFile ? URL.createObjectURL(selectedFile) : null;

    const handleAvatarChange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            console.log(file);
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const submitAvatar = async () => {
        if (selectedFile) {
            const imgSmall = await imageCompression(selectedFile, {
                maxWidthOrHeight: 60,
                useWebWorker: true,
            });
            const imgLarge = await imageCompression(selectedFile, {
                maxWidthOrHeight: 200,
                useWebWorker: true,
            });
            await uploadAvatarMutation.mutateAsync({
                imgSmall,
                imgLarge,
            });
        }
    };

    return (
        <div>
            {previewImg && <img className="h-20" src={previewImg} />}
            <Field orientation="vertical">
                <Input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                />
                <Button className="font-bold text-lg" onClick={submitAvatar}>
                    submit
                </Button>
            </Field>
        </div>
    );
}
