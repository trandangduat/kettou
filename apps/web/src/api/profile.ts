export const updateAvatar = async (imgs: {
    imgSmall: File;
    imgLarge: File;
}) => {
    const { imgSmall, imgLarge } = imgs;
    const { type } = imgSmall;

    // Get presigned urls for 2 images
    let res = await fetch("/api/profile/avatar/get-presigned", {
        method: "POST",
        body: JSON.stringify({ type }),
        headers: {
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        const errMsg = await res.text();
        throw new Error(errMsg);
    }

    const urls: Record<string, { putUrl: string; publicUrl: string }> =
        await res.json();

    // Put the images to R2 storage using presigned urls
    const sizes = ["small", "large"];
    const files = [imgSmall, imgLarge];
    const putPromises = [];

    for (let i = 0; i < sizes.length; i++) {
        const { putUrl } = urls[sizes[i]];
        console.log(putUrl);
        putPromises.push(
            fetch(putUrl, {
                method: "PUT",
                body: files[i],
                headers: {
                    "Content-Type": type,
                },
            }),
        );
    }

    let putRes = await Promise.all(putPromises);
    if (putRes.some((res) => res.ok === false)) {
        throw new Error("One of the PUT request failed.");
    }

    // Confirm with the backend and update the avatar
    let publicUrls = {
        small: urls["small"].publicUrl,
        large: urls["large"].publicUrl
    };
    let updRes = await fetch("/api/profile/avatar/update", {
        method: "POST",
        body: JSON.stringify(publicUrls),
        headers: {
          "Content-Type": "application/json",
        }
    });

    if (!updRes.ok) {
        throw new Error("Updating avatar in server failed.")
    }
    return publicUrls;
};
