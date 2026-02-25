import {RefObject, useRef} from "react";
import {ActiveSelection, Canvas as FabricCanvas} from "fabric";

interface UseCanvasClipboardArgs {
  fabricCanvasRef: RefObject<FabricCanvas | null>;
  saveHistory: () => void;
  onSelectionChange: (hint: string) => void;
}

export function useCanvasClipboard({
  fabricCanvasRef,
  saveHistory,
  onSelectionChange,
}: UseCanvasClipboardArgs) {
  const clipboardRef = useRef<any>(null);

  const copy = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const activeObj = canvas.getActiveObject();
    if (!activeObj) return;

    clipboardRef.current = await activeObj.clone();
    onSelectionChange("Objeto copiado.");
  };

  const paste = async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || !clipboardRef.current) return;

    const clonedObj = await clipboardRef.current.clone();
    canvas.discardActiveObject();
    clonedObj.set({
      left: (clonedObj.left || 0) + 20,
      top: (clonedObj.top || 0) + 20,
      evented: true,
    });

    if (clonedObj.type === "activeSelection") {
      clonedObj.canvas = canvas;
      (clonedObj as ActiveSelection).forEachObject((obj: any) => {
        canvas.add(obj);
      });
      clonedObj.setCoords();
    } else {
      canvas.add(clonedObj);
    }

    if (clipboardRef.current) {
      clipboardRef.current.top = (clipboardRef.current.top || 0) + 20;
      clipboardRef.current.left = (clipboardRef.current.left || 0) + 20;
    }

    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
    saveHistory();
    onSelectionChange("Objeto colado.");
  };

  return {
    clipboardRef,
    copy,
    paste,
  };
}
