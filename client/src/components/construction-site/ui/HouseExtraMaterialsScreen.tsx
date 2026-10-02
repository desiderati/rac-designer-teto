import {ProtectedImage} from '@/components/ui/ProtectedImage.tsx';
import {useEffect, useRef} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import type {UpdateHouseExtraMaterialsInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {ConstructionSiteState, PersistedHouseRecord} from '@/shared/types/construction-site.ts';
import {houseExtraMaterialsFormSchema, type HouseExtraMaterialsFormValues} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {
  getAvatarPalette,
  getHouseExtraMaterialsInitialState,
  getHouseFamily,
  getHouseFamilyName,
  getHouseInitials,
  toHouseExtraMaterialsInput,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {PrimaryButton} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';
import {FormActionDock} from '@/components/construction-site/ui/lib/FormActionDock.tsx';
import {HouseExtraMaterialsFields} from './HouseExtraMaterialsFields.tsx';

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
  const formSourceKey = [constructionSite.constructionSite.id, house.id, house.version, house.updatedAt].join(':');
  const lastFormSourceKey = useRef(formSourceKey);
  const {dirtyFields} = form.formState;

  useEffect(() => {
    if (lastFormSourceKey.current === formSourceKey) return;
    lastFormSourceKey.current = formSourceKey;
    form.reset(getHouseExtraMaterialsInitialState(house));
  }, [form, formSourceKey, house]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    if (isReadOnly) return;
    await onSave(toHouseExtraMaterialsInput(values));
  });

  return (
    <form
      data-testid='house-extra-materials-form'
      className='construction-management-form grid min-w-0 gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseExtraMaterialsSidebar constructionSite={constructionSite} house={house}/>

        <div>
          <HouseExtraMaterialsFields control={form.control} dirtyFields={dirtyFields} disabled={isReadOnly}/>

        <FormActionDock testId='house-extra-materials-actions'>
          <PrimaryButton type='submit' disabled={isReadOnly} className='w-full min-w-0'>Salvar Materiais Extras</PrimaryButton>
        </FormActionDock>
      </div>
    </form>
  );
}

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
      <ProtectedImage
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
