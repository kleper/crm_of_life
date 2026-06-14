import { KudoType } from "@prisma/client";

export interface KudoMetadata {
  icon: string;
  label: string;
  tone: string;
}

export const KUDO_TYPES: Record<KudoType, KudoMetadata> = {
  [KudoType.GREAT_JOB]: { icon: "👏", label: "¡Buen trabajo!", tone: "Logro" },
  [KudoType.THANK_YOU]: { icon: "🙏", label: "¡Gracias!", tone: "Gratitud" },
  [KudoType.TEAM_PLAYER]: { icon: "🤝", label: "Jugador de equipo", tone: "Colaboración" },
  [KudoType.ON_FIRE]: { icon: "🔥", label: "¡Estás en racha!", tone: "Celebración" },
  [KudoType.STAR]: { icon: "⭐", label: "Trabajo destacado", tone: "Logro" },
  [KudoType.HIGH_FIVE]: { icon: "🙌", label: "¡Choca esos cinco!", tone: "Ánimo" },
  [KudoType.MVP]: { icon: "🏆", label: "MVP del equipo", tone: "Logro" },
  [KudoType.COFFEE]: { icon: "☕", label: "Te debo un café", tone: "Gratitud" },
};

export const getKudoOptions = () => {
  return Object.entries(KUDO_TYPES).map(([type, meta]) => ({
    type: type as KudoType,
    ...meta,
  }));
};
