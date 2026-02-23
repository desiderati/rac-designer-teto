interface DimensionChildLike {
  type?: string;
  set: (patch: Record<string, unknown>) => void;
}

interface DimensionGroupLike {
  getObjects: () => DimensionChildLike[];
  dirty?: boolean;
}

export function applyDimensionEditorPatch(params: {
  group: DimensionGroupLike;
  value: string;
  color: string;
}): void {
  const textObj = params.group.getObjects().find((obj) => obj.type === "i-text");
  if (textObj) {
    textObj.set({text: params.value || " ", fill: params.color});
  }

  params.group.getObjects().forEach((child) => {
    if (child.type === "line") child.set({stroke: params.color});
    if (child.type === "triangle") child.set({fill: params.color});
  });

  params.group.dirty = true;
}
