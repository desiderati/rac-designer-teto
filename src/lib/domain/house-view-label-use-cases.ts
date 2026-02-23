import type {DomainHouseType, DomainViewType} from "./house-use-cases";

export function getViewLabelForHouseType(viewType: DomainViewType, houseType: DomainHouseType | null): string {
  switch (viewType) {
    case "top":
      return "Planta";

    case "front":
      return "Frontal";

    case "back":
      return houseType === "tipo3" ? "Lateral" : "Traseira";

    case "side1":
      return "Quadrado Fechado";

    case "side2":
      return "Quadrado Aberto";
  }
}
