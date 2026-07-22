/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [{ hostname: "images.pexels.com" }],
    },

    devIndicators: false,
};

export default nextConfig;
