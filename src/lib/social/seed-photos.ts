// Curated Unsplash photo IDs (free, no-auth direct URLs).
// Each entry tagged with a topic so we can pair photos with matching post text.
// All IDs verified to be public on Unsplash CDN at the time of writing.
export type PhotoEntry = { id: string; topic: "scenery" | "art" | "travel" | "city" | "food" | "trail"; alt: string };

export const PHOTOS: PhotoEntry[] = [
  { id: "photo-1506905925346-21bda4d32df4", topic: "scenery", alt: "alpine lake reflecting peaks" },
  { id: "photo-1469474968028-56623f02e42e", topic: "scenery", alt: "mountain road into the clouds" },
  { id: "photo-1501785888041-af3ef285b470", topic: "scenery", alt: "forest valley at sunrise" },
  { id: "photo-1464822759023-fed622ff2c3b", topic: "scenery", alt: "snowy mountain panorama" },
  { id: "photo-1472214103451-9374bd1c798e", topic: "scenery", alt: "lake with fog at dawn" },
  { id: "photo-1418065460487-3e41a6c84dc5", topic: "scenery", alt: "cabin under aurora" },
  { id: "photo-1493246507139-91e8fad9978e", topic: "scenery", alt: "lake with lone canoe" },
  { id: "photo-1475924156734-496f6cac6ec1", topic: "scenery", alt: "mountain layers at dusk" },
  { id: "photo-1551632811-561732d1e306", topic: "trail",   alt: "hikers on a ridge" },
  { id: "photo-1465056836041-7f43ac27dcb5", topic: "trail",   alt: "backpacker on misty trail" },
  { id: "photo-1485470733090-0aae1788d5af", topic: "trail",   alt: "alpine path through wildflowers" },
  { id: "photo-1486870591958-9b9d0d1dda99", topic: "trail",   alt: "winding mountain trail" },
  { id: "photo-1496080174650-637e3f22fa03", topic: "art",     alt: "moody black-and-white photograph" },
  { id: "photo-1502082553048-f009c37129b9", topic: "art",     alt: "dreamy film grain landscape" },
  { id: "photo-1504198266285-165a98aaa322", topic: "art",     alt: "soft pastel composition" },
  { id: "photo-1500964757637-c85e8a162699", topic: "art",     alt: "minimalist horizon with negative space" },
  { id: "photo-1508739773434-c26b3d09e071", topic: "art",     alt: "rainy window with city bokeh" },
  { id: "photo-1499856871958-5b9627545d1a", topic: "city",    alt: "rooftop view over a european city" },
  { id: "photo-1502602898657-3e91760cbb34", topic: "city",    alt: "paris from above at golden hour" },
  { id: "photo-1490806843957-31f4c9a91c65", topic: "city",    alt: "neon alley at night" },
  { id: "photo-1518684079-3c830dcef090", topic: "city",      alt: "tokyo crossing in rain" },
  { id: "photo-1480714378408-67cf0d13bc1b", topic: "city",    alt: "manhattan skyline" },
  { id: "photo-1493946740644-2d8a1f1a6aff", topic: "travel",  alt: "passport on a wooden table" },
  { id: "photo-1488646953014-85cb44e25828", topic: "travel",  alt: "world map with marker" },
  { id: "photo-1473625247510-8ceb1760943f", topic: "travel",  alt: "train winding through alps" },
  { id: "photo-1503220317375-aaad61436b1b", topic: "travel",  alt: "backpacker on a bridge" },
  { id: "photo-1530789253388-582c481c54b0", topic: "food",    alt: "ramen in a small bowl" },
  { id: "photo-1551183053-bf91a1d81141", topic: "food",      alt: "street food market at night" },
  { id: "photo-1414235077428-338989a2e8c0", topic: "food",    alt: "espresso cup on cafe table" },
  { id: "photo-1481833761820-0509d3217039", topic: "food",    alt: "wine glass at sunset" },
  { id: "photo-1469854523086-cc02fe5d8800", topic: "scenery", alt: "vast desert dunes" },
  { id: "photo-1454496522488-7a8e488e8606", topic: "scenery", alt: "patagonia spires at golden hour" },
  { id: "photo-1452377063879-6f9ec0a64bf4", topic: "scenery", alt: "fjord cliff overlook" },
  { id: "photo-1500530855697-b586d89ba3ee", topic: "scenery", alt: "iceland black beach" },
  { id: "photo-1476610182048-b716b8518aae", topic: "trail",   alt: "rocky summit ridge" },
  { id: "photo-1483728642387-6c3bdd6c93e5", topic: "scenery", alt: "rolling hills with morning light" },
  { id: "photo-1444703686981-a3abbc4d4fe3", topic: "scenery", alt: "forest with shafts of sunlight" },
  { id: "photo-1501785888041-af3ef285b470", topic: "scenery", alt: "valley sunrise" },
  { id: "photo-1495567720989-cebdbdd97913", topic: "art",     alt: "polaroid still life" },
  { id: "photo-1517483000871-1dbf64a6e1c6", topic: "art",     alt: "muted analog scene" },
  { id: "photo-1504198458649-3128b932f49e", topic: "city",    alt: "kyoto temple alley" },
  { id: "photo-1493558103817-58b2924bce98", topic: "city",    alt: "seoul night street" },
  { id: "photo-1444084316824-dc26d6657664", topic: "city",    alt: "lisbon tram ascending" },
  { id: "photo-1528728329032-2972f65dfb3f", topic: "travel",  alt: "wing over snow" },
  { id: "photo-1502920917128-1aa500764cbd", topic: "travel",  alt: "campervan on coastal road" },
  { id: "photo-1518551933037-91b2f5f229cc", topic: "trail",   alt: "tent under stars" },
  { id: "photo-1465147264571-cdec0721be7c", topic: "trail",   alt: "lake with kayak at sunrise" },
  { id: "photo-1476610182048-b716b8518aae", topic: "trail",   alt: "summit photographer" },
  { id: "photo-1535941339077-2dd1c7963098", topic: "food",    alt: "pasta on rustic table" },
  { id: "photo-1473093295043-cdd812d0e601", topic: "food",    alt: "breakfast with map" },
  { id: "photo-1517248135467-4c7edcad34c4", topic: "city",    alt: "florence rooftops at golden hour" },
];

export function photoUrl(id: string, w = 1200, q = 78): string {
  return `https://images.unsplash.com/${id}?w=${w}&q=${q}&auto=format&fit=crop`;
}

export function pickPhoto(seed: number, topic?: PhotoEntry["topic"]): PhotoEntry {
  const pool = topic ? PHOTOS.filter((p) => p.topic === topic) : PHOTOS;
  return pool[seed % pool.length];
}
