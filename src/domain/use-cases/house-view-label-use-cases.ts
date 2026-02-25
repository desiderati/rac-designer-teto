import {HouseTypeExcludeNull, HouseViewType} from "@/shared/types/house.ts";

export function getViewLabelForHouseType(viewType: HouseViewType, houseType: HouseTypeExcludeNull | null): string {
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
