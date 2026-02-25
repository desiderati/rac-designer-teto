import {FabricObject} from "fabric";
import {canvasObjectProps} from "@/components/lib/canvas";

// Extend FabricObject prototype to include custom properties in serialization
const originalToObject = FabricObject.prototype.toObject;
FabricObject.prototype.toObject = function (propertiesToInclude: string[] = []) {
  return originalToObject.call(this, [...canvasObjectProps, ...propertiesToInclude]);
};
