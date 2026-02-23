export const CANVAS_WIDTH = 1300;
export const CANVAS_HEIGHT = 1300;
export const BASE_TOP_WIDTH = 610;
export const BASE_TOP_HEIGHT = 300;

export const customProps = [
  "myType",
  "lockScalingFlip",
  "subTargetCheck",
  "id",
  "selectable",
  "lockScalingY",
  "houseView",
  "houseViewType",
  "houseInstanceId",
  "houseSide",
  "isHouseBody",
  "pilotiId",
  "pilotiHeight",
  "pilotiIsMaster",
  "pilotiNivel",
  "isPilotiCircle",
  "isPilotiText",
  "isPilotiHitArea",
  "isPilotiNivelText",
  "isPilotiRect",
  "pilotiBaseHeight",
  "isPilotiSizeLabel",
  "isHouseBorderEdge",
  "edgeSide",
  "isGroundElement",
  "isGroundLine",
  "isGroundSegment",
  "isNivelMarker",
  "isNivelLabel",
  "isGroundFill",
  "groundSeed",
  "isRightSide",
  "isFlippedHorizontally",
  "isPilotiStripe",
  "isTopDoorMarker",
  "markerSide",
  "isContraventamento",
  "isContraventamentoElevation",
  "contraventamentoId",
  "contraventamentoCol",
  "contraventamentoStartRow",
  "contraventamentoEndRow",
  "contraventamentoSide",
  "contraventamentoAnchorPilotiId",
  "contraventamentoSourcePilotiId",
  "isMacroGroup",
];

export const PILOTI_HEIGHTS = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0];

// Colors for master piloti (same as door - light brown)
export const MASTER_PILOTI_FILL = "#D4A574";
export const MASTER_PILOTI_STROKE = "#8B4513";
export const MASTER_SHARED_STROKE_WIDTH = 2;

// Corner piloti IDs (A1, A4, C1, C4) - only these can be master and have nivel
export const CORNER_PILOTI_IDS = ["piloti_0_0", "piloti_3_0", "piloti_0_2", "piloti_3_2"];

export const BASE_PILOTI_HEIGHT_PX = 100;
