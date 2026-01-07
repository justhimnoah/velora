// Console tiers (LOCKED – matches Internal.docx)
const TIERS = {
  base: {
    name: "Base",
    resolution: "1080p",
    fps: "30–60",
    price: 299,
  },
  core: {
    name: "Core",
    resolution: "1440p",
    fps: "60",
    price: 399,
  },
  pro: {
    name: "Pro",
    resolution: "4K",
    fps: "60–120",
    price: 499,
  }
};

// Storage
const STORAGE = [
  { size: "512 GB", price: 0 },
  { size: "1 TB", price: 50 },
  { size: "2 TB", price: 100 },
];

// Controller options (from Customization Details)
const CONTROLLER = {
  sticks: ["Standard", "High-tension"],
  triggers: ["Digital", "Analog", "Adjustable"],
  backButtons: ["None", "2 Buttons", "4 Buttons"],
  haptics: ["None", "Standard", "Advanced"],
  battery: ["Standard", "Extended"],
  stickCaps: ["Red", "Green", "Blue", "Yellow", "White", "Black"],
};
