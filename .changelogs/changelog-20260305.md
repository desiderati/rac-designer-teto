# Changelog — 2026-03-05

## Viga de reforço perpendicular (tipo 3)

- Adicionado componente `DoorReinforcementBeam` em `House3DScene.tsx`
- Renderiza uma viga perpendicular abaixo do piso, na posição da porta, conectando a linha de vigas central (B) à linha
  da borda (A ou C), exclusivamente para `houseType === 'tipo3'`
- Dimensões e material idênticos às vigas de piso existentes (`FLOOR_BEAM_HEIGHT` × `FLOOR_BEAM_STRIP_DEPTH`)
