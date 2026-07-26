/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            { hostname: "images.pexels.com" },
            { hostname: "res.cloudinary.com" },
        ],
    },

    devIndicators: false,
};

export default nextConfig;
