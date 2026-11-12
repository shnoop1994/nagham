/** Arabic note names for natural degrees */
export const NOTE_NAMES = ["دو", "ري", "مي", "فا", "صول", "لا", "سي"];

/**
 * Maqam definitions.
 * degrees: cents above tonic for one octave (including octave end).
 * labels: Arabic names for those scale degrees (excluding final octave duplicate).
 */
export const MAQAMAT = {
  free: {
    id: "free",
    title: "بيانو حر",
    blurb: "لوحة كاملة بكل الدرجات",
    // Chromatic + Arabic quarter tones across two octaves built dynamically
    mode: "chromatic",
  },
  rast: {
    id: "rast",
    title: "راست",
    blurb: "أساس الطرب الشرقي",
    mode: "maqam",
    degrees: [0, 200, 350, 500, 700, 900, 1050, 1200],
    labels: ["دو", "ري", "مي↓", "فا", "صول", "لا", "سي↓"],
  },
  bayati: {
    id: "bayati",
    title: "بياتي",
    blurb: "دفء ونَفَس شعبي",
    mode: "maqam",
    degrees: [0, 150, 300, 500, 700, 850, 1000, 1200],
    labels: ["ري", "مي↓", "فا", "صول", "لا", "سي↓", "دو"],
  },
  hijaz: {
    id: "hijaz",
    title: "حجاز",
    blurb: "شجن ورحابة",
    mode: "maqam",
    degrees: [0, 100, 400, 500, 700, 800, 1100, 1200],
    labels: ["ري", "مي♭", "فا♯", "صول", "لا", "سي♭", "دو♯"],
  },
  saba: {
    id: "saba",
    title: "صبا",
    blurb: "حنين رقيق",
    mode: "maqam",
    degrees: [0, 150, 300, 400, 700, 850, 1000, 1100],
    labels: ["ري", "مي↓", "فا", "صول♭", "لا", "سي↓", "دو", "ري♭"],
  },
  nahawand: {
    id: "nahawand",
    title: "نهاوند",
    blurb: "عمق ناعم",
    mode: "maqam",
    degrees: [0, 200, 300, 500, 700, 800, 1000, 1200],
    labels: ["دو", "ري", "مي♭", "فا", "صول", "لا♭", "سي♭"],
  },
  ajam: {
    id: "ajam",
    title: "عجم",
    blurb: "بهجة مشرقة",
    mode: "maqam",
    degrees: [0, 200, 400, 500, 700, 900, 1100, 1200],
    labels: ["دو", "ري", "مي", "فا", "صول", "لا", "سي"],
  },
  kurd: {
    id: "kurd",
    title: "كرد",
    blurb: "سكون ووضوح",
    mode: "maqam",
    degrees: [0, 100, 300, 500, 700, 800, 1000, 1200],
    labels: ["ري", "مي♭", "فا", "صول", "لا", "سي♭", "دو"],
  },
};

const A4 = 440;
const C3_MIDI = 48; // C3 as base for free keyboard

export function midiToHz(midi) {
  return A4 * Math.pow(2, (midi - 69) / 12);
}

export function centsToHz(tonicHz, cents) {
  return tonicHz * Math.pow(2, cents / 1200);
}

/**
 * Build key descriptors for the active section.
 * Free: two octaves of white + black + quarter-tone keys filling the board.
 * Maqam: two octaves of scale degrees (highlighted tonic).
 */
export function buildKeys(sectionId, tonicMidi = 60) {
  const maqam = MAQAMAT[sectionId] || MAQAMAT.free;

  if (maqam.mode === "chromatic") {
    return buildFreeKeys();
  }

  return buildMaqamKeys(maqam, tonicMidi);
}

function buildFreeKeys() {
  const keys = [];
  // Two octaves starting at C3: white, optional quarter, black pattern
  // Pattern per octave for natural + sharp + quarter between naturals where Arabic uses them
  const pattern = [
    { name: "دو", kind: "white", semis: 0 },
    { name: "دو↑", kind: "quarter", semis: 0.5 },
    { name: "دو♯", kind: "black", semis: 1 },
    { name: "ري", kind: "white", semis: 2 },
    { name: "ري↑", kind: "quarter", semis: 2.5 },
    { name: "ري♯", kind: "black", semis: 3 },
    { name: "مي", kind: "white", semis: 4 },
    { name: "مي↑", kind: "quarter", semis: 4.5 },
    { name: "فا", kind: "white", semis: 5 },
    { name: "فا↑", kind: "quarter", semis: 5.5 },
    { name: "فا♯", kind: "black", semis: 6 },
    { name: "صول", kind: "white", semis: 7 },
    { name: "صول↑", kind: "quarter", semis: 7.5 },
    { name: "صول♯", kind: "black", semis: 8 },
    { name: "لا", kind: "white", semis: 9 },
    { name: "لا↑", kind: "quarter", semis: 9.5 },
    { name: "لا♯", kind: "black", semis: 10 },
    { name: "سي", kind: "white", semis: 11 },
    { name: "سي↑", kind: "quarter", semis: 11.5 },
  ];

  for (let oct = 0; oct < 2; oct++) {
    for (const step of pattern) {
      const midi = C3_MIDI + oct * 12 + step.semis;
      keys.push({
        id: `f-${oct}-${step.semis}`,
        label: step.name,
        sub: oct === 0 ? "منخفض" : "مرتفع",
        kind: step.kind,
        hz: midiToHz(midi),
        isTonic: step.semis === 0,
        inScale: true,
      });
    }
  }

  // Final high C
  keys.push({
    id: "f-2-0",
    label: "دو",
    sub: "أعلى",
    kind: "white",
    hz: midiToHz(C3_MIDI + 24),
    isTonic: true,
    inScale: true,
  });

  return keys;
}

function buildMaqamKeys(maqam, tonicMidi) {
  const tonicHz = midiToHz(tonicMidi);
  const keys = [];
  const degreeCents = maqam.degrees;
  const labels = maqam.labels;

  for (let oct = 0; oct < 2; oct++) {
    const count = degreeCents.length - 1; // exclude octave duplicate inside loop
    for (let i = 0; i < count; i++) {
      const cents = degreeCents[i] + oct * 1200;
      const label = labels[i] || NOTE_NAMES[i % 7];
      const isQuarter = isQuarterish(degreeCents, i);
      keys.push({
        id: `${maqam.id}-${oct}-${i}`,
        label,
        sub: oct === 0 ? "الأولى" : "الثانية",
        kind: i === 0 ? "white" : isQuarter ? "quarter" : i % 2 === 0 ? "white" : "black",
        hz: centsToHz(tonicHz, cents),
        isTonic: i === 0,
        inScale: true,
      });
    }
  }

  // Top octave tonic
  keys.push({
    id: `${maqam.id}-2-0`,
    label: labels[0] || "أساس",
    sub: "ختام",
    kind: "white",
    hz: centsToHz(tonicHz, 2400),
    isTonic: true,
    inScale: true,
  });

  // Visual variety: keep first of each octave as white, alternate others
  return keys.map((key, index) => {
    if (key.isTonic) return { ...key, kind: "white" };
    const local = index % (maqam.degrees.length - 1);
    const kind = isQuarterish(maqam.degrees, local)
      ? "quarter"
      : local % 2 === 0
        ? "white"
        : "black";
    return { ...key, kind };
  });
}

function isQuarterish(degrees, index) {
  if (index <= 0 || index >= degrees.length) return false;
  const step = degrees[index] - degrees[index - 1];
  // Typical Arabic microtonal steps around 50–150 cents from previous
  return step === 150 || step === 50 || step === 250;
}
