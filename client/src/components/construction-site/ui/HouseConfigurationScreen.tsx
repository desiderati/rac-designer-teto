import {type KeyboardEvent, type ReactNode, useEffect, useRef, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Droplets, Layers, LoaderCircle, LocateFixed, Pickaxe, Waves} from 'lucide-react';
import type {CreateHouseInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  ConstructionSiteState,
  PersistedHouseRecord,
  ResidentAction,
  SoilProfile,
} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {
  formatPhoneInput,
  HOUSE_FAMILY_NAME_MAX_LENGTH,
  HOUSE_LEADERS_MAX_LENGTH,
  HOUSE_NOTES_MAX_LENGTH,
  HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH,
  HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH,
  houseConfigurationFormSchema,
  PHONE_MASK_MAX_LENGTH,
  type HouseConfigurationFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {HOUSE_SIZE_OPTIONS} from '@/components/construction-site/ui/lib/constants.ts';
import {
  CheckboxField,
  PhotoUploadField,
  PrimaryButton,
  RadioField,
  StaticMapPreview,
  TextArea,
  TextField,
  VisualSelectField,
  buttonClassName,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {cn} from '@/components/rac-editor/lib/utils.ts';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion.tsx';
import {
  formatDateOnly,
  getConstructionInitials,
  getHouseConfigurationInitialState,
  toHouseConfigurationInput,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';
import {FormSectionHeader} from '@/components/construction-site/ui/lib/FormSectionHeader.tsx';
import {TerrainPhotosField} from './TerrainPhotosField.tsx';

export function HouseConfigurationScreen({
  constructionSite,
  house,
  onSave,
  onDirtyChange,
  readOnly = false,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord | null;
  onSave(input: CreateHouseInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
  readOnly?: boolean;
}) {
  const isReadOnly = readOnly || house?.status === 'built' || house?.status === 'archived';
  const [locationLookupStatus, setLocationLookupStatus] = useState<'idle' | 'loading'>('idle');
  const [locationLookupMessage, setLocationLookupMessage] = useState<{
    tone: 'success' | 'error';
    text: string;
  } | null>(null);
  const form = useForm<HouseConfigurationFormValues>({
    resolver: zodResolver(houseConfigurationFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getHouseConfigurationInitialState(constructionSite, house),
  });
  const formSourceKey = [
    constructionSite.constructionSite.id,
    house?.id ?? 'new-house',
    house?.version ?? 0,
    house?.updatedAt ?? '',
  ].join(':');
  const lastFormSourceKey = useRef(formSourceKey);
  const locationQuery = form.watch('locationQuery');
  const [openSections, setOpenSections] = useState([
    'section-01',
    'section-02',
    'section-03',
    'section-04',
    'section-05',
    'section-06',
  ]);
  const {errors, dirtyFields, submitCount} = form.formState;

  const sectionHasError = (...fields: Array<keyof HouseConfigurationFormValues>) => fields.some((field) => Boolean(errors[field]));
  const sectionHasDirtyChanges = (...fields: Array<keyof HouseConfigurationFormValues>) => fields.some((field) => Boolean(dirtyFields[field]));
  const firstErrorSection = sectionHasError('familyName', 'primaryContactName', 'primaryContactPhone', 'primaryContactEmail', 'familyPhotoDataUrl')
    ? 'section-01'
    : sectionHasError('houseSize', 'leaders', 'notes')
      ? 'section-02'
      : sectionHasError('soilProfile', 'hasHydraulicObstacles', 'hasUndergroundObstacles', 'hasElevatedObstacles', 'hasNeighborSetbackConstraints')
        ? 'section-03'
        : sectionHasError('residentActions')
          ? 'section-04'
          : sectionHasError('terrainPhotos')
            ? 'section-05'
            : sectionHasError('locationQuery')
              ? 'section-06'
              : undefined;

  useEffect(() => {
    if (lastFormSourceKey.current === formSourceKey) return;
    lastFormSourceKey.current = formSourceKey;
    form.reset(getHouseConfigurationInitialState(constructionSite, house));
    setLocationLookupStatus('idle');
    setLocationLookupMessage(null);
  }, [constructionSite, form, formSourceKey, house]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  useEffect(() => {
    if (!submitCount || !firstErrorSection) return;
    setOpenSections((current) => current.includes(firstErrorSection) ? current : [...current, firstErrorSection]);
  }, [firstErrorSection, submitCount]);

  const submitForm = form.handleSubmit(async (values) => {
    if (isReadOnly) return;
    await onSave(toHouseConfigurationInput(values));
  });

  const useCurrentLocation = () => {
    if (isReadOnly) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setLocationLookupMessage({
        tone: 'error',
        text: 'Localização do navegador indisponível neste dispositivo.',
      });
      return;
    }

    setLocationLookupStatus('loading');
    setLocationLookupMessage(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = [
          formatGeolocationCoordinate(position.coords.latitude),
          formatGeolocationCoordinate(position.coords.longitude),
        ].join(', ');

        form.setValue('locationQuery', coordinates, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        form.clearErrors('locationQuery');
        setLocationLookupStatus('idle');
        setLocationLookupMessage({
          tone: 'success',
          text: 'Localização atual aplicada ao mapa.',
        });
      },
      (error) => {
        setLocationLookupStatus('idle');
        setLocationLookupMessage({
          tone: 'error',
          text: getGeolocationErrorMessage(error),
        });
      },
      {
        enableHighAccuracy: true,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    );
  };

  const loadMapFromLocationQuery = () => {
    if (isReadOnly) return;
    setLocationLookupMessage(null);
    void form.trigger('locationQuery');
  };

  const handleLocationQueryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    event.stopPropagation();
    loadMapFromLocationQuery();
  };

  return (
    <form
      data-testid='house-configuration-form'
      className='grid min-w-0 gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <Accordion
        type='multiple'
        value={openSections}
        onValueChange={setOpenSections}
        className='space-y-3'
      >
        <HouseFormSection
          number='01'
          title='Detalhes da Família'
          dirty={sectionHasDirtyChanges('familyName', 'primaryContactName', 'primaryContactPhone', 'primaryContactEmail', 'familyPhotoDataUrl')}
        >
          <div className='space-y-5'>
            <Controller
              control={form.control}
              name='familyPhotoDataUrl'
              render={({field}) => (
                <PhotoUploadField
                  label='Foto da Família'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  dirty={Boolean(dirtyFields.familyPhotoDataUrl)}
                  loadedDropZoneClassName='h-72'
                  disabled={isReadOnly}
                />
              )}
            />
            <div data-testid='family-identity-grid' className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-4'>
                <Controller
                  control={form.control}
                  name='familyName'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Nome da Família'
                      placeholder='ex: Tadeu e Odete'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                      maxLength={HOUSE_FAMILY_NAME_MAX_LENGTH}
                      error={fieldState.error?.message}
                      dirty={Boolean(dirtyFields.familyName)}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='primaryContactPhone'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Telefone'
                      placeholder='(41) 00000-0000'
                      value={field.value}
                      onChange={(primaryContactPhone) => field.onChange(formatPhoneInput(primaryContactPhone))}
                      onBlur={field.onBlur}
                      maxLength={PHONE_MASK_MAX_LENGTH}
                      inputMode='numeric'
                      error={fieldState.error?.message}
                      dirty={Boolean(dirtyFields.primaryContactPhone)}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
              <div className='space-y-4'>
                <Controller
                  control={form.control}
                  name='primaryContactName'
                  render={({field, fieldState}) => (
                    <TextField
                      label='Contato Principal'
                      placeholder='Nome completo'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      required
                      maxLength={HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH}
                      error={fieldState.error?.message}
                      dirty={Boolean(dirtyFields.primaryContactName)}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='primaryContactEmail'
                  render={({field, fieldState}) => (
                    <TextField
                      label='E-mail'
                      type='email'
                      placeholder='contato@dominio.com'
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      maxLength={HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH}
                      error={fieldState.error?.message}
                      dirty={Boolean(dirtyFields.primaryContactEmail)}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </HouseFormSection>

        <HouseFormSection number='02' title='Sobre a Casa' dirty={sectionHasDirtyChanges('houseSize', 'leaders', 'notes')}>
          <div data-testid='about-house-grid' className='grid gap-4 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='houseSize'
              render={({field, fieldState}) => (
                <VisualSelectField
                  label='Tamanho da Casa'
                  ariaLabel='Tamanho da Casa'
                  value={field.value}
                  options={HOUSE_SIZE_OPTIONS}
                  onChange={(houseSize) => field.onChange(houseSize)}
                  error={fieldState.error?.message}
                  dirty={Boolean(dirtyFields.houseSize)}
                  disabled={isReadOnly}
                />
              )}
            />
            <Controller
              control={form.control}
              name='leaders'
              render={({field, fieldState}) => (
                <TextField
                  label='Líderes'
                  placeholder='Nomes dos líderes da casa'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={HOUSE_LEADERS_MAX_LENGTH}
                  error={fieldState.error?.message}
                  dirty={Boolean(dirtyFields.leaders)}
                  disabled={isReadOnly}
                />
              )}
            />
            <div className='md:col-span-2'>
              <Controller
                control={form.control}
                name='notes'
                render={({field, fieldState}) => (
                  <TextArea
                    label='Notas'
                    placeholder='Observações da casa, implantação, acessibilidade ou decisões combinadas com a família...'
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    maxLength={HOUSE_NOTES_MAX_LENGTH}
                    error={fieldState.error?.message}
                    dirty={Boolean(dirtyFields.notes)}
                    disabled={isReadOnly}
                  />
                )}
              />
            </div>
          </div>
        </HouseFormSection>

        <HouseFormSection
          number='03'
          title='Restrições Locais'
          dirty={sectionHasDirtyChanges('soilProfile', 'hasHydraulicObstacles', 'hasUndergroundObstacles', 'hasElevatedObstacles', 'hasNeighborSetbackConstraints')}
        >
          <div data-testid='local-restrictions-grid' className='grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <Controller
              control={form.control}
              name='soilProfile'
              render={({field}) => (
                <fieldset className='min-w-0 space-y-3'>
                  <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Perfil do Solo</legend>
                  <div className='space-y-3'>
                    <RadioField
                      icon={<Layers className='h-5 w-5'/>}
                      label='Terreno Estável / Argiloso'
                      name='soilProfile'
                      value='stable_clay'
                      checked={field.value === 'stable_clay'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                      dirty={Boolean(dirtyFields.soilProfile)}
                      disabled={isReadOnly}
                    />
                    <RadioField
                      icon={<Pickaxe className='h-5 w-5'/>}
                      label='Terreno Firme / Duro'
                      name='soilProfile'
                      value='firm_hard'
                      checked={field.value === 'firm_hard'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                      dirty={Boolean(dirtyFields.soilProfile)}
                      disabled={isReadOnly}
                    />
                    <RadioField
                      icon={<Waves className='h-5 w-5'/>}
                      label='Solo Molhado / Lama'
                      name='soilProfile'
                      value='alluvial'
                      checked={field.value === 'alluvial'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                      dirty={Boolean(dirtyFields.soilProfile)}
                      disabled={isReadOnly}
                    />
                    <RadioField
                      icon={<Droplets className='h-5 w-5'/>}
                      label='Lençol Freático / Água no Fundo'
                      name='soilProfile'
                      value='water_table'
                      checked={field.value === 'water_table'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                      dirty={Boolean(dirtyFields.soilProfile)}
                      disabled={isReadOnly}
                    />
                  </div>
                </fieldset>
              )}
            />

            <fieldset className='min-w-0 space-y-3'>
              <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Obstáculos no Local</legend>
              <div className='space-y-3'>
                <Controller
                  control={form.control}
                  name='hasHydraulicObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Hidráulicos'
                      description='Canos ou fossas'
                      checked={field.value}
                      onChange={field.onChange}
                      dirty={Boolean(dirtyFields.hasHydraulicObstacles)}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasUndergroundObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Subterrâneos'
                      description='Raízes, pedras ou caliças (entulhos ou concreto)'
                      checked={field.value}
                      onChange={field.onChange}
                      dirty={Boolean(dirtyFields.hasUndergroundObstacles)}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasElevatedObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Elevados'
                      description='Árvores, galhos ou fios de tensão'
                      checked={field.value}
                      onChange={field.onChange}
                      dirty={Boolean(dirtyFields.hasElevatedObstacles)}
                      disabled={isReadOnly}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasNeighborSetbackConstraints'
                  render={({field}) => (
                    <CheckboxField
                      label='Servidões Vizinhas'
                      description='Recuo rígido de limite (esquadro apertado)'
                      checked={field.value}
                      onChange={field.onChange}
                      dirty={Boolean(dirtyFields.hasNeighborSetbackConstraints)}
                      disabled={isReadOnly}
                    />
                  )}
                />
              </div>
            </fieldset>
          </div>
        </HouseFormSection>

        <HouseFormSection number='04' title='Ações dos Moradores' dirty={sectionHasDirtyChanges('residentActions')}>
          <Controller
            control={form.control}
            name='residentActions'
            render={({field}) => (
              <div data-testid='resident-actions-grid' className='grid gap-3 md:grid-cols-2'>
                {RESIDENT_ACTION_OPTIONS.map((option) => (
                  <CheckboxField
                    key={option.value}
                    label={option.label}
                    description={option.description}
                    checked={(field.value ?? []).includes(option.value)}
                    dirty={Boolean(dirtyFields.residentActions)}
                    onChange={(checked) => {
                      const current = field.value ?? [];
                      field.onChange(
                        checked
                          ? [...new Set([...current, option.value])]
                          : current.filter((action) => action !== option.value),
                      );
                    }}
                    disabled={isReadOnly}
                  />
                ))}
              </div>
            )}
          />
        </HouseFormSection>

        <HouseFormSection number='05' title='Fotos do Terreno' dirty={sectionHasDirtyChanges('terrainPhotos')}>
          <Controller
            control={form.control}
            name='terrainPhotos'
            render={({field}) => (
              <TerrainPhotosField
                constructionSiteId={constructionSite.constructionSite.id}
                value={(field.value ?? []).map((photo, index) => ({
                  id: photo.id ?? `terrain-photo-${index + 1}`,
                  url: photo.url ?? '',
                  ...(photo.description ? {description: photo.description} : {}),
                }))}
                onChange={field.onChange}
                disabled={isReadOnly}
              />
            )}
          />
        </HouseFormSection>

        <HouseFormSection number='06' title='Características do Local' dirty={sectionHasDirtyChanges('locationQuery')}>
          <div data-testid='site-characteristics-grid' className='grid gap-4 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='locationQuery'
              render={({field, fieldState}) => (
                <div className='space-y-2 md:col-span-2'>
                  <div data-testid='location-geography-row' className='grid gap-4 md:grid-cols-2 md:items-start'>
                    <TextField
                      label='Localização Geográfica'
                      placeholder='Carregar a partir de coordenadas'
                      value={field.value}
                      onChange={(value) => {
                        setLocationLookupMessage(null);
                        field.onChange(value);
                      }}
                      onBlur={field.onBlur}
                      onKeyDown={handleLocationQueryKeyDown}
                      error={fieldState.error?.message}
                      dirty={Boolean(dirtyFields.locationQuery)}
                      disabled={isReadOnly}
                    />
                    <button
                      type='button'
                      aria-describedby={locationLookupMessage ? 'current-location-feedback' : undefined}
                      className={cn(buttonClassName, 'w-full gap-2 border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 md:mt-[1.45rem]')}
                      onClick={useCurrentLocation}
                      disabled={isReadOnly || locationLookupStatus === 'loading'}
                    >
                      {locationLookupStatus === 'loading' ? <LoaderCircle className='h-4 w-4 animate-spin'/> : <LocateFixed className='h-4 w-4'/>}
                      {locationLookupStatus === 'loading' ? 'Obtendo localização...' : 'Usar localização atual'}
                    </button>
                  </div>
                  {locationLookupMessage ? (
                    <p
                      id='current-location-feedback'
                      role={locationLookupMessage.tone === 'error' ? 'alert' : 'status'}
                      className={cn('text-xs font-medium', locationLookupMessage.tone === 'error' ? 'text-red-600' : 'text-blue-700')}
                    >
                      {locationLookupMessage.text}
                    </p>
                  ) : null}
                </div>
              )}
            />
            <div data-testid='static-map-wrapper' className='md:col-span-2'>
              <StaticMapPreview locationQuery={locationQuery}/>
            </div>
          </div>
        </HouseFormSection>
      </Accordion>
      <div data-testid='site-actions-grid' className='sticky bottom-0 z-20 -mx-2 mt-4 grid w-full min-w-0 gap-4 bg-white/95 px-2 py-3 backdrop-blur-sm sm:static sm:col-start-2 sm:mx-0 sm:mt-0 sm:bg-transparent sm:px-0 sm:py-0 md:grid-cols-2'>
        <PrimaryButton type='submit' disabled={isReadOnly} className='w-full min-w-0 md:col-start-2'>Salvar Configurações</PrimaryButton>
      </div>
    </form>
  );
}

export function HouseConfigurationSidebar({constructionSite}: { constructionSite: ConstructionSiteState }) {
  const code = constructionSite.constructionSite.externalCode?.trim() || 'Sem código';
  const communityLabel = getConstructionSiteCommunityName(constructionSite) ?? 'Sem comunidade';
  const constructionDateLabel = formatDateOnly(constructionSite.constructionSite.constructionDate);

  return (
    <aside className='h-fit rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-4'>
      {constructionSite.constructionSite.photoDataUrl ? (
        <img
          src={constructionSite.constructionSite.photoDataUrl}
          alt={`Foto da construção ${code}`}
          className='h-28 w-full rounded-xl object-cover'
        />
      ) : (
        <span
          role='img'
          aria-label={`Foto da construção ${code}`}
          className='grid h-28 w-full place-items-center rounded-xl bg-slate-900 text-lg font-bold text-white'
        >
          {getConstructionInitials(code)}
        </span>
      )}
      <dl className='mt-4 space-y-3'>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Código da CC</dt>
          <dd className='mt-1 text-sm font-semibold text-slate-950'>{code}</dd>
        </div>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Comunidade</dt>
          <dd
            data-testid='construction-sidebar-community'
            title={communityLabel}
            className='mt-1 block max-w-full truncate text-sm font-medium leading-5 text-slate-600'
          >
            {communityLabel}
          </dd>
        </div>
        <div>
          <dt className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400'>Data da Construção</dt>
          <dd className='mt-1 text-sm font-medium leading-5 text-slate-600'>{constructionDateLabel}</dd>
        </div>
      </dl>
    </aside>
  );
}

export function HouseFormSection({
  number,
  title,
  dirty = false,
  children,
}: {
  number: string;
  title: string;
  dirty?: boolean;
  children: ReactNode;
}) {
  return (
    <section className='space-y-2'>
      <AccordionItem value={`section-${number}`} className='!border-0 bg-transparent px-0 shadow-none'>
        <AccordionTrigger aria-label={`Alternar seção ${title}`} className='gap-3 py-3 hover:no-underline'>
          <FormSectionHeader number={number} title={title} dirty={dirty}/>
        </AccordionTrigger>
        <AccordionContent>
          <div className='space-y-4'>{children}</div>
        </AccordionContent>
      </AccordionItem>
      {number !== '06' ? <div aria-hidden='true' className='mx-4 h-px bg-slate-200/80' data-testid='house-section-divider'/> : null}
    </section>
  );
}

const RESIDENT_ACTION_OPTIONS: Array<{
  value: ResidentAction;
  label: string;
  description: string;
}> = [
  {value: 'excavate', label: 'Escavar', description: 'Nivelar o terreno removendo terra excedente.'},
  {value: 'fill', label: 'Aterrar', description: 'Preencher desníveis para criar uma base plana.'},
  {value: 'remove_vegetation', label: 'Retirar vegetação', description: 'Remover mato alto, arbustos ou árvores da área.'},
  {value: 'remove_debris', label: 'Retirar entulho', description: 'Limpar restos de obra, lixo ou materiais soltos.'},
  {value: 'dismantle_house', label: 'Desmontar a Casa', description: 'Desmontar a casa existente antes de iniciar a nova construção.'},
  {value: 'clear_access', label: 'Liberar acesso', description: 'Garantir passagem livre para a equipe e materiais.'},
];

function formatGeolocationCoordinate(value: number): string {
  return value.toFixed(6);
}

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Permita o acesso à localização do navegador para usar a posição atual.';
  }

  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Não foi possível obter a localização atual do dispositivo.';
  }

  if (error.code === error.TIMEOUT) {
    return 'A localização demorou para responder. Tente novamente em um local com melhor sinal.';
  }

  return 'Não foi possível carregar a localização atual.';
}
