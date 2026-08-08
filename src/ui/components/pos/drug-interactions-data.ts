import { productName } from "./pos-data";

export interface DrugInteraction {
  pids: [string, string];
  severity: "moderate" | "severe";
  summary: string;
  explanation: string;
}

export const DRUG_INTERACTIONS: DrugInteraction[] = [
  {
    pids: ["PRD-1512", "PRD-1310"], // Ibuprofen 400mg + Lisinopril 10mg
    severity: "moderate",
    summary: "NSAID + ACE inhibitor",
    explanation:
      "Ibuprofen is an NSAID, which can blunt the blood-pressure-lowering effect of Lisinopril (an ACE inhibitor) and, with regular use, raise the risk of reduced kidney function. Consider confirming with the prescriber before dispensing both for ongoing use, and counsel the patient to use ibuprofen at the lowest effective dose for the shortest time needed.",
  },
  {
    pids: ["PRD-1042", "PRD-1204"], // Paracetamol 500mg + Cough Syrup 100ml
    severity: "moderate",
    summary: "Possible duplicate paracetamol",
    explanation:
      "Many combination cough and cold syrups already contain paracetamol. Dispensing this cough syrup alongside standalone Paracetamol risks the patient unintentionally exceeding the recommended daily paracetamol dose. Check the syrup's label with the patient and counsel them accordingly.",
  },
];

interface CartLike {
  pid: string;
}

export function findActiveInteractions(lines: CartLike[]): DrugInteraction[] {
  const pidsInCart = new Set(lines.map((l) => l.pid));
  return DRUG_INTERACTIONS.filter((interaction) => interaction.pids.every((pid) => pidsInCart.has(pid)));
}

export function interactionsForLine(pid: string, lines: CartLike[]): DrugInteraction[] {
  return findActiveInteractions(lines).filter((interaction) => interaction.pids.includes(pid));
}

export function interactionsForCandidate(candidatePid: string, lines: CartLike[]): DrugInteraction[] {
  const pidsInCart = new Set(lines.map((l) => l.pid));
  return DRUG_INTERACTIONS.filter(
    (interaction) =>
      interaction.pids.includes(candidatePid) &&
      interaction.pids.some((pid) => pid !== candidatePid && pidsInCart.has(pid)),
  );
}

export function otherPid(interaction: DrugInteraction, pid: string): string {
  return interaction.pids.find((p) => p !== pid) ?? pid;
}

export interface AiExchangeSeed {
  contextLabel: string;
  prompt: string;
  response: string;
}

export function interactionExchange(interaction: DrugInteraction): AiExchangeSeed {
  const [aId, bId] = interaction.pids;
  const aName = productName(aId);
  const bName = productName(bId);
  return {
    contextLabel: `Interaction · ${aName} + ${bName}`,
    prompt: `What's the interaction between ${aName} and ${bName}?`,
    response: interaction.explanation,
  };
}
