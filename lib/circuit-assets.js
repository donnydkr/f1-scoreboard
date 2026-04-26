const circuitSlugs = {
  "Albert Park": "albert-park",
  "Shanghai International": "shanghai-international",
  Suzuka: "suzuka",
  Bahrain: "bahrain",
  Jeddah: "jeddah",
  "Miami Autodrome": "miami-autodrome",
  Imola: "imola",
  Monaco: "monaco",
  "Barcelona-Catalunya": "barcelona-catalunya",
  "Gilles Villeneuve": "gilles-villeneuve",
  "Red Bull Ring": "red-bull-ring",
  Silverstone: "silverstone",
  "Spa-Francorchamps": "spa-francorchamps",
  Hungaroring: "hungaroring",
  Zandvoort: "zandvoort",
  Monza: "monza",
  Baku: "baku",
  "Marina Bay": "marina-bay",
  Americas: "americas",
  "Hermanos Rodriguez": "hermanos-rodriguez",
  Interlagos: "interlagos",
  "Las Vegas": "las-vegas",
  "Lusail International": "lusail-international",
  "Yas Marina": "yas-marina"
};

export const circuitAssets = Object.fromEntries(
  Object.entries(circuitSlugs).map(([circuitName, slug]) => [
    circuitName,
    `/circuits/${slug}/track.png`
  ])
);

export const circuitFlagAssets = Object.fromEntries(
  Object.entries(circuitSlugs).map(([circuitName, slug]) => [
    circuitName,
    `/circuits/${slug}/flag.png`
  ])
);

export function getCircuitAsset(circuitName) {
  if (!circuitName) return null;
  // Zoek de key op een case-insensitive manier
  const key = Object.keys(circuitAssets).find(
    (k) => k.toLowerCase() === circuitName.toLowerCase()
  );
  return key ? circuitAssets[key] : null;
}

export function getCircuitFlagAsset(circuitName) {
  if (!circuitName) return null;
  const key = Object.keys(circuitFlagAssets).find(
    (k) => k.toLowerCase() === circuitName.toLowerCase()
  );
  return key ? circuitFlagAssets[key] : null;
}
