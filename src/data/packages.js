// Packages built from existing services. Keep this file minimal for easy edits.
const packages = [
  {
    id: 1,
    name: "Lash & Brow Duo",
    tag: "Népszerű",
    description: "Szemöldök formázás + szemöldök festés + szempilla festés.",
    services: ["Szemöldökigazítás", "Szemöldökfestés", "Szempillafestés"],
    price: "csomagár",
  },
  {
    id: 2,
    name: "Szemöldök Pro",
    tag: "Ajánlott",
    description:
      "Szemöldök formázás és szemöldök festés a kiemelt, rendezett szemöldökért.",
    services: ["Szemöldökigazítás", "Szemöldökfestés"],
    price: "csomagár",
  },
  {
    id: 3,
    name: "Mini Relax",
    tag: "Gyors",
    description: "Rövid, relaxáló arcmasszázs a felfrissülésért.",
    services: ["Arcmasszázs"],
    price: "csomagár",
  },
  {
    id: 4,
    name: "Clean Face",
    tag: "Tisztító",
    description:
      "Mélytisztító arckezelés a bőr megújításáért (Tisztító kezelés).",
    services: ["Tisztító kezelés"],
    price: "csomagár",
  },
];

export default packages;
