import {useEffect, useState} from 'react';
import {Controller, type Control, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {UpdateHouseExtraMaterialsInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {
  HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH,
  HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH,
  houseExtraMaterialsFormSchema,
  type HouseExtraMaterialsFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {
  getAvatarPalette,
  getHouseExtraMaterialsInitialState,
  getHouseFamily,
  getHouseFamilyName,
  getHouseInitials,
  toHouseExtraMaterialsInput,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {
  PrimaryButton,
  TextArea,
  TextField,
  VisualSelectField,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import type {VisualSelectOption} from '@/components/construction-site/ui/lib/types.ts';
import type {StairType} from '@/shared/types/construction-site.ts';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';
import {FormSectionHeader} from '@/components/construction-site/ui/lib/FormSectionHeader.tsx';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion.tsx';

export function HouseExtraMaterialsScreen({
  constructionSite,
  house,
  onSave,
  onDirtyChange,
  readOnly = false,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
  onSave(input: UpdateHouseExtraMaterialsInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}) {
  const isReadOnly = readOnly || house.status === 'built' || house.status === 'archived';
  const form = useForm<HouseExtraMaterialsFormValues>({
    resolver: zodResolver(houseExtraMaterialsFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getHouseExtraMaterialsInitialState(house),
  });
  const [openSections, setOpenSections] = useState(['extra-materials']);
  const {errors, dirtyFields, submitCount} = form.formState;
  const hasSectionError = Boolean(
    errors.floorBeams
    || errors.rafters
    || errors.secondaryBeams
    || errors.gutters
    || errors.gutterCount
    || errors.stairType
    || errors.justification,
  );
  const hasSectionChanges = Boolean(
    dirtyFields.floorBeams
    || dirtyFields.rafters
    || dirtyFields.secondaryBeams
    || dirtyFields.gutters
    || dirtyFields.gutterCount
    || dirtyFields.stairType
    || dirtyFields.justification,
  );

  useEffect(() => {
    form.reset(getHouseExtraMaterialsInitialState(house));
  }, [house, form]);
  useEffect(() => {
    if (!submitCount || !hasSectionError) return;
    setOpenSections((current) => current.includes('extra-materials') ? current : [...current, 'extra-materials']);
  }, [hasSectionError, submitCount]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    if (isReadOnly) return;
    await onSave(toHouseExtraMaterialsInput(values));
  });

  return (
    <form
      data-testid='house-extra-materials-form'
      className='grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseExtraMaterialsSidebar constructionSite={constructionSite} house={house}/>

      <div>
        <Accordion type='multiple' value={openSections} onValueChange={setOpenSections} className='space-y-2'>
          <AccordionItem value='extra-materials' className='!border-0 bg-transparent px-0 shadow-none'>
            <AccordionTrigger aria-label='Alternar seção Materiais Extras' className='gap-3 py-3 hover:no-underline'>
              <FormSectionHeader number='07' title='Materiais Extras' dirty={hasSectionChanges}/>
            </AccordionTrigger>
            <AccordionContent>
              <div data-testid='extra-materials-grid' className='grid gap-4 md:grid-cols-2'>
                <IntegerField
                  control={form.control}
                  name='floorBeams'
                  label='Vigas de Piso'
                  placeholder='0'
                  disabled={isReadOnly}
                />
                <IntegerField
                  control={form.control}
                  name='rafters'
                  label='Caibros'
                  placeholder='0'
                  disabled={isReadOnly}
                />
                <IntegerField
                  control={form.control}
                  name='secondaryBeams'
                  label='Vigas Secundárias'
                  placeholder='0'
                  disabled={isReadOnly}
                />
                <IntegerField
                  control={form.control}
                  name='gutters'
                  label='Mata-juntas'
                  placeholder='0'
                  disabled={isReadOnly}
                />
                <IntegerField
                  control={form.control}
                  name='gutterCount'
                  label='Calhas'
                  placeholder='0'
                  disabled={isReadOnly}
                />
                <Controller
                  control={form.control}
                  name='stairType'
                  render={({field, fieldState}) => (
                    <VisualSelectField
                      label='Escada'
                      ariaLabel='Escada'
                      placeholder=''
                      value={field.value}
                      options={STAIR_OPTIONS}
                      onChange={field.onChange}
                      error={fieldState.error?.message}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <div className='md:col-span-2'>
                  <Controller
                    control={form.control}
                    name='justification'
                    render={({field, fieldState}) => (
                      <TextArea
                        label='Outros / Justificativa'
                        placeholder='Descreva materiais adicionais ou a justificativa para a solicitação...'
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        maxLength={HOUSE_EXTRA_MATERIAL_JUSTIFICATION_MAX_LENGTH}
                        error={fieldState.error?.message}
                        disabled={isReadOnly}
                      />
                    )}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div data-testid='house-extra-materials-actions' className='sticky bottom-0 z-20 -mx-2 mt-4 grid gap-4 bg-white/95 px-2 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:mt-4 sm:bg-transparent sm:px-0 sm:py-0 md:grid-cols-2'>
          <PrimaryButton type='submit' disabled={isReadOnly} className='w-full md:col-start-2'>Salvar Materiais Extras</PrimaryButton>
        </div>
      </div>
    </form>
  );
}

function IntegerField({
  control,
  name,
  label,
  placeholder,
  disabled = false,
}: {
  control: Control<HouseExtraMaterialsFormValues>;
  name: keyof Pick<HouseExtraMaterialsFormValues, 'floorBeams' | 'rafters' | 'secondaryBeams' | 'gutters' | 'gutterCount'>;
  label: string;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({field, fieldState}) => (
        <TextField
          label={label}
          placeholder={placeholder}
          value={field.value}
          onChange={(value) => field.onChange(normalizeIntegerDraft(value, field.value))}
          onBlur={field.onBlur}
          maxLength={HOUSE_EXTRA_MATERIAL_INTEGER_MAX_LENGTH}
          pattern='[0-9]*'
          inputMode='numeric'
          error={fieldState.error?.message}
          disabled={disabled}
        />
      )}
    />
  );
}

function normalizeIntegerDraft(value: string, previousValue: string): string {
  if (/^\d*$/.test(value)) return value;
  if (/[.,+\-\s]/.test(value) || /e/i.test(value)) return previousValue;
  return value.replace(/\D/g, '');
}

const STAIR_OPTIONS: VisualSelectOption<StairType | ''>[] = [
  {value: '', label: 'Sem escada', triggerLabel: '', ariaLabel: 'Sem escada'},
  {value: 'straight', label: 'Escada Reta'},
  {value: 'landing', label: 'Escada com Patamar'},
];

function HouseExtraMaterialsSidebar({
  constructionSite,
  house,
}: {
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord;
}) {
  const family = getHouseFamily(constructionSite, house);
  const familyName = getHouseFamilyName(constructionSite, house);
  const leaders = house.leaders?.trim() || 'Líderes não informados';

  return (
    <aside className='min-w-0 h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-4'>
      <HouseSummaryPhoto familyName={familyName} photoDataUrl={family?.photoDataUrl}/>
      <dl className='mt-4 space-y-3'>
        <SummaryItem
          label='Família'
          value={familyName}
          testId='house-extra-materials-sidebar-family'
        />
        <SummaryItem
          label='Líderes'
          value={leaders}
          testId='house-extra-materials-sidebar-leaders'
        />
      </dl>
    </aside>
  );
}

function HouseSummaryPhoto({
  familyName,
  photoDataUrl,
}: {
  familyName: string;
  photoDataUrl?: string;
}) {
  if (photoDataUrl) {
    return (
      <img
        src={photoDataUrl}
        alt={`Foto da família ${familyName}`}
        className='h-28 w-full rounded-xl object-cover'
      />
    );
  }

  const palette = getAvatarPalette(familyName);
  return (
    <span
      role='img'
      aria-label={`Foto gerada da família ${familyName}`}
      className='grid h-28 w-full place-items-center rounded-xl text-lg font-bold'
      style={{backgroundColor: palette.background, color: palette.foreground}}
    >
      {getHouseInitials(familyName)}
    </span>
  );
}

function SummaryItem({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <div className='min-w-0'>
      <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>{label}</dt>
      <dd className='mt-1 min-w-0 text-sm font-semibold leading-5 text-slate-950'>
        <span
          data-testid={testId}
          title={value}
          className='block max-w-full truncate'
        >
          {value}
        </span>
      </dd>
    </div>
  );
}
