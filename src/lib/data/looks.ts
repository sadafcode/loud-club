import type { Look } from "@/lib/types";

export const looks: Look[] = [
  {
    id: "concrete-hours",
    slug: "concrete-hours",
    title: "Concrete Hours",
    chapter: "Chapter 01",
    story:
      "Raw denim, soft fleece and a trouser with room to move. A uniform for long days spent between the studio and the street.",
    image: "photo-1488161628813-04466f872be2",
    gallery: ["photo-1516826957135-700dedea698c", "photo-1611312449408-fcece27cdbb7", "photo-1473966968600-fa801b869a1a"],
    productIds: ["selvedge-denim-jacket", "cloud-crew-sweatshirt", "pleated-chino"],
    collection: "boys",
  },
  {
    id: "signal-red",
    slug: "signal-red",
    title: "Signal Red",
    chapter: "Chapter 02",
    story:
      "Black leather with a single hit of red. The quietest wardrobe with one loud decision.",
    image: "photo-1529139574466-a303027c1d8b",
    gallery: ["photo-1520975954732-35dd22299614", "photo-1503342217505-b0a15ec3261c", "photo-1584917865442-de89df76afd3"],
    productIds: ["moto-leather-jacket", "noir-mark-tee", "patched-boyfriend-jean", "scarlet-top-handle"],
    collection: "all",
  },
  {
    id: "soft-power",
    slug: "soft-power",
    title: "Soft Power",
    chapter: "Chapter 03",
    story:
      "Merino in signal orange, a woven bag and bare legs in late autumn light. Warmth, worn lightly.",
    image: "photo-1475180098004-ca77a66827be",
    gallery: ["photo-1578587018452-892bacefd3f2", "photo-1590874103328-eac38a683ce7"],
    productIds: ["signal-knit-sweater", "rattan-carry"],
    collection: "girls",
  },
  {
    id: "after-office",
    slug: "after-office",
    title: "After Office",
    chapter: "Chapter 04",
    story:
      "Soft tailoring that survives the commute and the late dinner that follows. The tie is optional; the derby isn't.",
    image: "photo-1507680434567-5739c80be1ac",
    gallery: ["photo-1617127365659-c47fa864d8bc", "photo-1602810318383-e386cc2a3ccf", "photo-1614252235316-8c857d38b5f4"],
    productIds: ["midnight-blazer", "oxford-shirt", "raw-straight-denim", "cognac-derby"],
    collection: "boys",
  },
  {
    id: "weekend-uniform",
    slug: "weekend-uniform",
    title: "Weekend Uniform",
    chapter: "Chapter 05",
    story:
      "A heavyweight tee, a copper bomber and a cap you forget you're wearing. Saturday, sorted.",
    image: "photo-1552374196-1ab2a1c593e8",
    gallery: ["photo-1521572163474-6864f9cf17ab", "photo-1591047139829-d91aecb6caea", "photo-1588850561407-ed78c282e89b"],
    productIds: ["essential-heavyweight-tee", "copper-bomber", "pleated-chino", "dad-cap"],
    collection: "unisex",
  },
  {
    id: "coast-line",
    slug: "coast-line",
    title: "Coast Line",
    chapter: "Chapter 06",
    story:
      "Florals that move with the wind, hand-crochet and a basket for everything else. Written for the last warm week of the year.",
    image: "photo-1496747611176-843222e1e57c",
    gallery: ["photo-1434389677669-e08b4cac3105", "photo-1469334031218-e382a71b716b", "photo-1590874103328-eac38a683ce7"],
    productIds: ["floral-wrap-dress", "crochet-fringe-poncho", "rattan-carry"],
    collection: "girls",
  },
  {
    id: "winter-edit",
    slug: "winter-edit",
    title: "The Winter Edit",
    chapter: "Chapter 07",
    story:
      "Camel, bordeaux and a heritage check. Three coats, one merino crew, and a season of long walks.",
    image: "photo-1485968579580-b6d095142e6e",
    gallery: ["photo-1539533018447-63fcce2678e3", "photo-1483985988355-763728e1935b", "photo-1506634572416-48cdfe530110"],
    productIds: ["camel-wrap-coat", "bordeaux-tailored-coat", "check-overcoat", "bordeaux-merino-crew"],
    collection: "all",
  },
];

/** Editorial imagery for the homepage and campaign blocks. */
export const editorial = {
  hero: "photo-1488161628813-04466f872be2",
  heroAlt: "photo-1529139574466-a303027c1d8b",
  girls: "photo-1509631179647-0177331693ae",
  boys: "photo-1492447166138-50c3889fccb1",
  unisex: "photo-1523381210434-271e8be1f52b",
  rails: ["photo-1490481651871-ab68de25d43d", "photo-1512436991641-6745cdb1723f", "photo-1558769132-cb1aea458c5e"],
  flatlay: ["photo-1467043237213-65f2da53396f", "photo-1525507119028-ed4c629a60a3"],
};
