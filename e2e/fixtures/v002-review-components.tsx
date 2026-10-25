import {useState} from 'react';
import {Toaster, toast} from '@/components/ui/sonner.tsx';
import {HouseFieldAnalysisPreview} from '@/components/rac-editor/@canvas/ui/HouseFieldAnalysisPreview.tsx';
import {HouseMaterialsSummary} from '@/components/construction-site/ui/HouseMaterialsSummary.tsx';
import {CanvasOrientationNotice} from '@/components/rac-editor/ui/CanvasOrientationNotice.tsx';
import {HouseAggregate} from '@/domain/house/house.aggregate.ts';
import {getAllPilotiIds} from '@/shared/types/piloti.ts';
import {DEFAULT_HOUSE_PILOTI} from '@/shared/types/house.ts';
import type {HouseFieldAnalysisDraft} from '@/shared/types/house-field-analysis.ts';
import type {PersistedHouseRecord} from '@/shared/types/construction-site.ts';

// Fixture visual local: componentes de produção, dados sintéticos e nenhuma persistência/API.
const house = HouseAggregate.createInitialHouseState({id: 'v002-fixture', pilotiIds: getAllPilotiIds(),
  defaultPiloti: DEFAULT_HOUSE_PILOTI, defaultTerrainType: 1});
house.houseType = 'tipo6';
house.preAssignedSides = {front: 'bottom'};
house.pilotis = Object.fromEntries(getAllPilotiIds().map((id, index) => [id, {
  height: index === 0 || index === 11 ? 1.2 : 1, nivel: index === 0 ? .25 : .2, isMaster: index === 0,
}]));
const draft: HouseFieldAnalysisDraft = {house, selectedPilotiHeights: [1, 1.2], contraventamentos: []};
const record = {houseType: 'tipo6', houseSize: 'large', drawingDocument: {house}} as PersistedHouseRecord;

export function Fixture() {
  const [view, setView] = useState('Aviso');
  const [selected, setSelected] = useState('piloti_1_0');
  return <main className='mx-auto min-w-[360px] max-w-3xl p-4'>
    <h1 className='mb-4 text-lg font-bold'>Validação local V-002</h1>
    <nav aria-label='Cenário' className='mb-8 flex flex-wrap gap-3'>
      {['Aviso', 'Planta', 'Resumo', 'Rotação'].map((name) => <button key={name}
        onClick={() => setView(name)} className='rounded border bg-white px-3 py-2'>{name}</button>)}
    </nav>
    {view === 'Aviso' && <div className='flex flex-wrap gap-3'>
      <button onClick={() => toast.success('Análise de Campo salva.', {duration: Infinity})}>Salvar análise</button>
      <button onClick={() => toast.info('Detalhes da análise', {duration: Infinity,
        description: 'Confira os pilotis, os níveis e as observações antes de continuar. '.repeat(20),
        action: {label: 'Revisar análise', onClick: () => undefined}})}>Mensagem longa</button>
    </div>}
    {view === 'Planta' && <HouseFieldAnalysisPreview draft={draft} selectedPilotiId={selected} onSelectPiloti={setSelected}/>}
    {view === 'Resumo' && <div className='mt-64 flex justify-center'>
      <HouseMaterialsSummary familyName='Validação V-002' house={record} materials={{stairBeams: 2,
        stairType: 'landing', gutterCount: 2, gutterCaps: 2, gutterElbows: 2, asphaltBlanket: true,
        bracing: 4, rafters: 4, secondaryBeams: 2, gutters: 16,
        justification: 'Conferir os materiais e a orientação da porta antes da construção. '.repeat(3).trim()}}/>
    </div>}
    {view === 'Rotação' && <CanvasOrientationNotice onBackToConstructions={() => setView('Aviso')}/>}
    <Toaster/>
  </main>;
}
