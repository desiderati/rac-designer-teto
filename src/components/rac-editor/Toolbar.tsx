import { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTimes,
  faHome,
  faHouseChimneyWindow,
  faHouseChimney,
  faLockOpen,
  faLock,
  faShapes,
  faPenNib,
  faFont,
  faFileDownload,
  faFolderOpen,
  faTrash,
  faFilePdf,
  faLayerGroup,
  faBars,
  faTree,
  faWater,
  faSlash,
  faArrowRightLong,
  faArrowsLeftRight,
  faDoorOpen,
  faStairs,
  faLightbulb,
  faEllipsisVertical,
  faRotateLeft,
  faSquareFull,
  faTrowelBricks,
  faMagnifyingGlass,
  faToilet,
} from "@fortawesome/free-solid-svg-icons";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { HouseType } from '@/lib/house-manager';

interface ToolbarProps {
  onOpenHouseTypeSelector: () => void;
  onAddHouseFront: () => void;
  onAddHouseBack: () => void;
  onAddHouseSide1: () => void;
  onAddHouseSide2: () => void;
  onUngroup: () => void;
  onGroup: () => void;
  onAddWall: () => void;
  onAddDoor: () => void;
  onAddStairs: () => void;
  onAddTree: () => void;
  onAddWater: () => void;
  onAddFossa: () => void;
  onAddLine: () => void;
  onAddArrow: () => void;
  onAddDimension: () => void;
  onToggleDrawMode: () => void;
  onAddText: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onDelete: () => void;
  onSavePDF: () => void;
  isDrawing: boolean;
  activeSubmenu: "house" | "elements" | "lines" | "overflow" | null;
  onToggleHouseMenu: () => void;
  onToggleElementsMenu: () => void;
  onToggleLinesMenu: () => void;
  onToggleOverflowMenu: () => void;
  showTips: boolean;
  onToggleTips: () => void;
  showZoomControls: boolean;
  onToggleZoomControls: () => void;
  tutorialHighlight?: "main-fab" | "house" | "elements" | "zoom-minimap" | "more-options" | null;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onRestartTutorial: () => void;
  isTutorialActive?: boolean;
  // House type and view counts
  houseType: HouseType;
  // View limits: { current, max }
  frontViewCount?: { current: number; max: number };
  backViewCount?: { current: number; max: number };
  side1ViewCount?: { current: number; max: number };
  side2ViewCount?: { current: number; max: number };
}

function FABButton({
  icon,
  title,
  onClick,
  color = "#ecf0f1",
  isActive = false,
  isMain = false,
  className = "",
  isPulsing = false,
  hideTooltip = false,
  tooltipSide = "right" as "right" | "left",
}: {
  icon: IconDefinition;
  title: string;
  onClick: () => void;
  color?: string;
  isActive?: boolean;
  isMain?: boolean;
  className?: string;
  isPulsing?: boolean;
  hideTooltip?: boolean;
  tooltipSide?: "right" | "left";
}) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "border-none rounded-xl bg-[#2c3e50] text-[#ecf0f1] cursor-pointer transition-all duration-200 flex justify-center items-center shadow-lg hover:bg-[#0092DD] hover:scale-105 active:scale-95",
        isMain ? "w-12 h-12 text-xl" : "w-11 h-11 text-lg",
        isActive && "bg-[#e67e22] border-2 border-white",
        isPulsing && "animate-[pulse_3s_ease-in-out_infinite] ring-4 ring-amber-400 ring-opacity-75 z-50",
        className,
      )}
    >
      <FontAwesomeIcon icon={icon} style={{ color }} />
    </button>
  );

  if (hideTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} className="bg-[#333] text-white">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

function SubMenuButton({
  icon,
  title,
  onClick,
  color = "#ecf0f1",
  hideTooltip = false,
  tooltipSide = "bottom" as "bottom" | "left",
  isAtLimit = false,
}: {
  icon: IconDefinition;
  title: string;
  onClick: () => void;
  color?: string;
  hideTooltip?: boolean;
  tooltipSide?: "bottom" | "left";
  isAtLimit?: boolean;
}) {
  // Button always looks normal, but hover is gray when at limit
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "w-11 h-11 border-none rounded-xl text-lg cursor-pointer transition-all duration-200 flex justify-center items-center shadow-md",
        "bg-[#34495e]", // Always normal background
        isAtLimit
          ? "hover:bg-gray-500 hover:opacity-60" // Gray hover when at limit
          : "hover:bg-[#0092DD] hover:scale-105 active:scale-95" // Normal hover otherwise
      )}
    >
      <FontAwesomeIcon icon={icon} style={{ color }} />
    </button>
  );

  if (hideTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side={tooltipSide} align={tooltipSide === "left" ? "center" : "start"} className="bg-[#333] text-white">
        {title}
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  onOpenHouseTypeSelector,
  onAddHouseFront,
  onAddHouseBack,
  onAddHouseSide1,
  onAddHouseSide2,
  onUngroup,
  onGroup,
  onAddWall,
  onAddDoor,
  onAddStairs,
  onAddTree,
  onAddWater,
  onAddFossa,
  onAddLine,
  onAddArrow,
  onAddDimension,
  onToggleDrawMode,
  onAddText,
  onExportJSON,
  onImportJSON,
  onDelete,
  onSavePDF,
  isDrawing,
  activeSubmenu,
  onToggleHouseMenu,
  onToggleElementsMenu,
  onToggleLinesMenu,
  onToggleOverflowMenu,
  showTips,
  onToggleTips,
  showZoomControls,
  onToggleZoomControls,
  tutorialHighlight,
  isMenuOpen,
  onToggleMenu,
  onRestartTutorial,
  isTutorialActive = false,
  houseType,
  frontViewCount = { current: 0, max: 0 },
  backViewCount = { current: 0, max: 0 },
  side1ViewCount = { current: 0, max: 0 },
  side2ViewCount = { current: 0, max: 0 },
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = "";
    }
  };

  const handleAction = (action: () => void) => {
    action();
  };

  return (
    <>
      <input type="file" ref={fileInputRef} accept=".json" onChange={handleFileChange} className="hidden" />

      {/* FAB Container - Fixed position top left */}
      <div className="fixed top-5 left-5 z-50 flex flex-col gap-2">
        {/* Main FAB Button */}
        <FABButton
          icon={isMenuOpen ? faTimes : faPlus}
          title={isMenuOpen ? "Fechar Menu" : "Abrir Menu"}
          onClick={onToggleMenu}
          isMain
          className={isMenuOpen ? "bg-[#e74c3c] hover:bg-[#c0392b]" : ""}
          isPulsing={tutorialHighlight === "main-fab"}
          hideTooltip={isTutorialActive}
        />

        {/* Menu Items - shown when open */}
        {isMenuOpen && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-top-2 duration-200">
            {/* House Button */}
            <div className="relative">
              <FABButton
                icon={faHome}
                title="Casa TETO (Opções)"
                onClick={() => houseType ? handleAction(onToggleHouseMenu) : handleAction(onOpenHouseTypeSelector)}
                isActive={activeSubmenu === "house"}
                isPulsing={tutorialHighlight === "house"}
                hideTooltip={activeSubmenu === "house" || isTutorialActive}
              />
              {/* House Submenu - only show if house type is selected */}
              {activeSubmenu === "house" && houseType && (
                <div className="absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2">
                {/* Tipo 6: Frontal, Traseira, Quadrado Fechado (x2) */}
                  {houseType === 'tipo6' && (
                    <>
                      <SubMenuButton
                        icon={faHouseChimney}
                        title="Visão Frontal"
                        onClick={() => handleAction(onAddHouseFront)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={frontViewCount.current >= frontViewCount.max}
                      />
                      <SubMenuButton
                        icon={faHouseChimneyWindow}
                        title="Visão Traseira"
                        onClick={() => handleAction(onAddHouseBack)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={backViewCount.current >= backViewCount.max}
                      />
                      <SubMenuButton
                        icon={faSquareFull}
                        title="Quadrado Fechado"
                        onClick={() => handleAction(onAddHouseSide1)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={side1ViewCount.current >= side1ViewCount.max}
                      />
                    </>
                  )}
                  {/* Tipo 3: Lateral (x2), Quadrado Aberto, Quadrado Fechado */}
                  {houseType === 'tipo3' && (
                    <>
                      <SubMenuButton
                        icon={faHouseChimneyWindow}
                        title="Visão Lateral"
                        onClick={() => handleAction(onAddHouseBack)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={backViewCount.current >= backViewCount.max}
                      />
                      <SubMenuButton
                        icon={faDoorOpen}
                        title="Quadrado Aberto"
                        onClick={() => handleAction(onAddHouseSide2)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={side2ViewCount.current >= side2ViewCount.max}
                      />
                      <SubMenuButton
                        icon={faSquareFull}
                        title="Quadrado Fechado"
                        onClick={() => handleAction(onAddHouseSide1)}
                        hideTooltip={isTutorialActive}
                        isAtLimit={side1ViewCount.current >= side1ViewCount.max}
                      />
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Unlock */}
            <FABButton
              icon={faLockOpen}
              title="Desbloquear (Desagrupar)"
              onClick={() => handleAction(onUngroup)}
              hideTooltip={isTutorialActive}
            />

            {/* Lock */}
            <FABButton
              icon={faLock}
              title="Bloquear (Agrupar)"
              onClick={() => handleAction(onGroup)}
              hideTooltip={isTutorialActive}
            />

            {/* Elements */}
            <div className="relative">
              <FABButton
                icon={faShapes}
                title="Elementos"
                onClick={() => handleAction(onToggleElementsMenu)}
                isActive={activeSubmenu === "elements"}
                isPulsing={tutorialHighlight === "elements"}
                hideTooltip={activeSubmenu === "elements" || isTutorialActive}
              />
              {/* Elements Submenu */}
              {activeSubmenu === "elements" && (
                <div className="absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2">
                  <SubMenuButton
                    icon={faTrowelBricks}
                    title="Objeto / Muro"
                    onClick={() => handleAction(onAddWall)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faDoorOpen}
                    title="Porta"
                    onClick={() => handleAction(onAddDoor)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faStairs}
                    title="Escada"
                    onClick={() => handleAction(onAddStairs)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faTree}
                    title="Árvore"
                    onClick={() => handleAction(onAddTree)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faWater}
                    title="Água / Rio"
                    onClick={() => handleAction(onAddWater)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faToilet}
                    title="Fossa"
                    onClick={() => handleAction(onAddFossa)}
                    hideTooltip={isTutorialActive}
                  />
                </div>
              )}
            </div>

            {/* Lines */}
            <div className="relative">
              <FABButton
                icon={faBars}
                title="Linhas"
                onClick={() => handleAction(onToggleLinesMenu)}
                isActive={activeSubmenu === "lines"}
                hideTooltip={activeSubmenu === "lines" || isTutorialActive}
              />
              {/* Lines Submenu */}
              {activeSubmenu === "lines" && (
                <div className="absolute left-14 top-0 flex flex-row gap-1 animate-in slide-in-from-left-2">
                  <SubMenuButton
                    icon={faSlash}
                    title="Linha Reta"
                    onClick={() => handleAction(onAddLine)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faArrowRightLong}
                    title="Seta Simples"
                    onClick={() => handleAction(onAddArrow)}
                    hideTooltip={isTutorialActive}
                  />
                  <SubMenuButton
                    icon={faArrowsLeftRight}
                    title="Distância"
                    onClick={() => handleAction(onAddDimension)}
                    hideTooltip={isTutorialActive}
                  />
                </div>
              )}
            </div>

            {/* Pencil */}
            <FABButton
              icon={faPenNib}
              title="Lápis"
              onClick={() => handleAction(onToggleDrawMode)}
              isActive={isDrawing}
              hideTooltip={isTutorialActive}
            />

            {/* Text */}
            <FABButton
              icon={faFont}
              title="Texto Livre"
              onClick={() => handleAction(onAddText)}
              hideTooltip={isTutorialActive}
            />

            {/* Zoom/Minimap Toggle */}
            <FABButton
              icon={faMagnifyingGlass}
              title={showZoomControls ? "Esconder Zoom/Minimap" : "Mostrar Zoom/Minimap"}
              onClick={onToggleZoomControls}
              color={showZoomControls ? "#ecf0f1" : "#74b9ff"}
              isActive={showZoomControls}
              isPulsing={tutorialHighlight === "zoom-minimap"}
              hideTooltip={isTutorialActive}
            />

            {/* Delete */}
            <FABButton
              icon={faTrash}
              title="Excluir Item"
              onClick={() => handleAction(onDelete)}
              color="#ffaaaa"
              hideTooltip={isTutorialActive}
            />
          </div>
        )}
      </div>

      {/* FAB for Overflow Menu - Fixed position top right */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 items-end">
        <FABButton
          icon={faEllipsisVertical}
          title="Mais Opções"
          onClick={() => handleAction(onToggleOverflowMenu)}
          isMain
          isActive={activeSubmenu === "overflow"}
          isPulsing={tutorialHighlight === "more-options"}
          hideTooltip={activeSubmenu === "overflow" || isTutorialActive}
          tooltipSide="left"
        />
        {/* Overflow Submenu - opens downward */}
        {activeSubmenu === "overflow" && (
          <div className="flex flex-col gap-1 items-end animate-in slide-in-from-top-2 duration-200">
            <SubMenuButton
              icon={faFileDownload}
              title="Exportar Projeto (JSON)"
              onClick={() => handleAction(onExportJSON)}
              color="#ffeaa7"
              hideTooltip={isTutorialActive}
              tooltipSide="left"
            />
            <SubMenuButton
              icon={faFolderOpen}
              title="Abrir Projeto (JSON)"
              onClick={() => fileInputRef.current?.click()}
              color="#ffeaa7"
              hideTooltip={isTutorialActive}
              tooltipSide="left"
            />
            <SubMenuButton
              icon={faFilePdf}
              title="Salvar PDF"
              onClick={() => handleAction(onSavePDF)}
              color="#aaffaa"
              hideTooltip={isTutorialActive}
              tooltipSide="left"
            />
            <SubMenuButton
              icon={faLightbulb}
              title="Dicas"
              onClick={onToggleTips}
              color="#f1c40f"
              hideTooltip={isTutorialActive}
              tooltipSide="left"
            />
            <SubMenuButton
              icon={faRotateLeft}
              title="Reiniciar Canvas"
              onClick={onRestartTutorial}
              color="#74b9ff"
              hideTooltip={isTutorialActive}
              tooltipSide="left"
            />
          </div>
        )}
      </div>
    </>
  );
}
