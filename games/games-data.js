export const games = [
    {
        id: "orbit-racer",
        title: "Orbit Racer",
        description: "High-speed futuristic racing across orbital tracks.",
        price: 1299,
        status: "Released", // Released | Coming Soon
        genres: ["Racing", "Sci-Fi"],
        tags: ["Multiplayer", "Fast-Paced"],
            releaseDate: "2025-03-15", // YYYY-MM-DD

        sale: {
            percent: 25,
            ends: "2025-04-01"
        },
        cover: "/assets/games/orbit-racer/cover.jpg",
        media: [
        { type: "image", src: "/assets/games/orbit-racer/1.jpg" },
        { type: "image", src: "/assets/games/orbit-racer/2.jpg" },
        { type: "video", src: "/assets/games/orbit-racer/trailer.mp4" }
        ]
    },
];