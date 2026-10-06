import {useEffect, useState} from 'react';
import {Controller, useFormState, type Control, type FieldNamesMarkedBoolean} from 'react-hook-form';
import type {HouseExtraMaterialsFormValues} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {
  HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH,
  HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {TextArea, TextField, VisualSelectField} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs.tsx';
import type {VisualSelectOption} from '@/components/construction-site/ui/lib/types.ts';
import type {StairType} from '@/shared/types/construction-site.ts';
import {STAIR_TYPE_LABELS} from '@/shared/lib/house-extra-materials.ts';

type IntegerFieldName = keyof Pick<HouseExtraMaterialsFormValues,
  'stairBeams' | 'rafters' | 'secondaryBeams' | 'gutters' | 'gutterCount' | 'gutterCaps' | 'gutterElbows' | 'bracing'>;

const MATERIAL_TABS = [
  {id: 'house', label: 'Casa', fields: ['stairBeams', 'stairType']},
  {id: 'roof', label: 'Telhado', fields: ['gutterCount', 'gutterCaps', 'gutterElbows', 'asphaltBlanket']},
  {id: 'repairs', label: 'Reparos', fields: ['bracing', 'rafters', 'secondaryBeams', 'gutters', 'justification']},
] as const;
export const HOUSE_EXTRA_MATERIAL_FIELDS = MATERIAL_TABS.flatMap((tab) => [...tab.fields]);

export function HouseExtraMaterialsFields({control, dirtyFields, disabled = false}: {
  control: Control<HouseExtraMaterialsFormValues>;
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<HouseExtraMaterialsFormValues>>>;
  disabled?: boolean;
}) {
  const [activeTab, setActiveTab] = useState('house');
  const {errors, submitCount} = useFormState({control});
  const firstErrorTab = MATERIAL_TABS.find((tab) => tab.fields.some((field) => errors[field]))?.id;
  useEffect(() => {
    if (submitCount && firstErrorTab) setActiveTab(firstErrorTab);
  }, [submitCount, firstErrorTab]);
  return (
    <Tabs data-testid='house-extra-materials-fields' value={activeTab} onValueChange={setActiveTab}>
      <TabsList aria-label='Materiais Extras' className='mb-4 grid h-auto w-full grid-cols-3 rounded-none border-b border-slate-200 bg-transparent p-0'>
        {MATERIAL_TABS.map((tab) => <TabsTrigger key={tab.id} value={tab.id}
          className='min-h-11 gap-2 rounded-none border-b-2 border-transparent px-2 data-[state=active]:border-blue-600 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none'>
          {tab.label}
          {tab.fields.some((field) => errors[field]) ? <span className='text-red-700' aria-label='Contém erro'>!</span>
            : tab.fields.some((field) => dirtyFields[field]) ? <span className='h-2 w-2 rounded-full bg-amber-500' aria-label='Alterações não salvas'/> : null}
        </TabsTrigger>)}
      </TabsList>
      <TabsContent value='house' forceMount hidden={activeTab !== 'house'} className='space-y-3 data-[state=inactive]:hidden'>
        <div data-testid='extra-materials-grid' className='grid gap-4 md:grid-cols-2'>
          <IntegerField control={control} name='stairBeams' label='Vigas p/ Escada' dirty={Boolean(dirtyFields.stairBeams)} disabled={disabled}/>
          <Controller control={control} name='stairType' render={({field, fieldState}) => (
            <VisualSelectField label='Tipo Escada' ariaLabel='Tipo Escada' placeholder='' value={field.value}
              options={STAIR_OPTIONS} onChange={field.onChange} error={fieldState.error?.message}
              dirty={Boolean(dirtyFields.stairType)} disabled={disabled}/>
          )}/>
        </div>
      </TabsContent>
      <TabsContent value='roof' forceMount hidden={activeTab !== 'roof'} className='space-y-3 data-[state=inactive]:hidden'>
        <div className='grid grid-cols-2 gap-4'>
          <IntegerField control={control} name='gutterCount' label='Calhas' dirty={Boolean(dirtyFields.gutterCount)} disabled={disabled}/>
          <IntegerField control={control} name='gutterCaps' label='Tampão' dirty={Boolean(dirtyFields.gutterCaps)} disabled={disabled}/>
          <IntegerField control={control} name='gutterElbows' label='Joelhos' dirty={Boolean(dirtyFields.gutterElbows)} disabled={disabled}/>
          <Controller control={control} name='asphaltBlanket' render={({field, fieldState}) => (
            <VisualSelectField label='Manta Asfáltica' ariaLabel='Manta Asfáltica' value={field.value}
              options={ASPHALT_OPTIONS} onChange={field.onChange} error={fieldState.error?.message}
              dirty={Boolean(dirtyFields.asphaltBlanket)} disabled={disabled}/>
          )}/>
        </div>
      </TabsContent>
      <TabsContent value='repairs' forceMount hidden={activeTab !== 'repairs'} className='space-y-3 data-[state=inactive]:hidden'>
        <div className='grid grid-cols-2 gap-4'>
          <IntegerField control={control} name='bracing' label='Contraventamento' dirty={Boolean(dirtyFields.bracing)} disabled={disabled}/>
          <IntegerField control={control} name='rafters' label='Caibros' dirty={Boolean(dirtyFields.rafters)} disabled={disabled}/>
          <IntegerField control={control} name='secondaryBeams' label='Secundárias' dirty={Boolean(dirtyFields.secondaryBeams)} disabled={disabled}/>
          <IntegerField control={control} name='gutters' label='Mata-Juntas' dirty={Boolean(dirtyFields.gutters)} disabled={disabled}/>
          <div className='col-span-2'>
            <Controller control={control} name='justification' render={({field, fieldState}) => (
              <TextArea label='Outros / Justificativas'
                placeholder='Descreva materiais adicionais ou a justificativa para a solicitação...'
                value={field.value} onChange={field.onChange} onBlur={field.onBlur}
                maxLength={HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH} error={fieldState.error?.message}
                dirty={Boolean(dirtyFields.justification)} disabled={disabled}/>
            )}/>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function IntegerField({control, name, label, dirty, disabled}: {
  control: Control<HouseExtraMaterialsFormValues>;
  name: IntegerFieldName;
  label: string;
  dirty: boolean;
  disabled: boolean;
}) {
  return <Controller control={control} name={name} render={({field, fieldState}) => (
    <TextField label={label} placeholder='0' value={field.value}
      onChange={(value) => field.onChange(normalizeIntegerDraft(value, field.value))} onBlur={field.onBlur}
      maxLength={HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH} pattern='[0-9]*' inputMode='numeric'
      error={fieldState.error?.message} dirty={dirty} disabled={disabled}/>
  )}/>;
}

function normalizeIntegerDraft(value: string, previousValue: string): string {
  if (/^\d*$/.test(value)) return value;
  if (/[.,+\-\s]/.test(value) || /e/i.test(value)) return previousValue;
  return value.replace(/\D/g, '');
}

const STAIR_OPTIONS: VisualSelectOption<StairType | ''>[] = [
  {value: '', label: 'Sem escada', triggerLabel: '', ariaLabel: 'Sem escada'},
  {value: 'straight', label: STAIR_TYPE_LABELS.straight},
  {value: 'landing', label: STAIR_TYPE_LABELS.landing},
  {value: 'access_ramp', label: STAIR_TYPE_LABELS.access_ramp},
];

const ASPHALT_OPTIONS: VisualSelectOption<'yes' | 'no'>[] = [
  {value: 'no', label: 'Não'},
  {value: 'yes', label: 'Sim'},
];
