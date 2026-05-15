import {type ReactNode, useEffect} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Droplets, Mountain, Waves} from 'lucide-react';
import type {CreateHouseInput} from '@/components/rac-editor/lib/construction-site-session.ts';
import type {
  ConstructionSiteState,
  PersistedHouseRecord,
  SoilProfile,
} from '@/shared/types/construction-site.ts';
import {getConstructionSiteCommunityName} from '@/shared/types/construction-site.ts';
import {
  formatPhoneInput,
  HOUSE_FAMILY_NAME_MAX_LENGTH,
  HOUSE_LEADERS_MAX_LENGTH,
  HOUSE_NOTES_MAX_LENGTH,
  HOUSE_PRIMARY_CONTACT_NAME_MAX_LENGTH,
  houseConfigurationFormSchema,
  PHONE_MASK_MAX_LENGTH,
  type HouseConfigurationFormValues,
} from '@/components/construction-site/lib/construction-site-form-validation.ts';
import {HOUSE_SIZE_OPTIONS, TERRAIN_COMPLEXITY_OPTIONS} from '@/components/construction-site/ui/lib/constants.ts';
import {
  CheckboxField,
  PhotoUploadField,
  PrimaryButton,
  RadioField,
  StaticMapPreview,
  TextArea,
  TextField,
  VisualSelectField,
} from '@/components/construction-site/ui/lib/shared-controls.tsx';
import {
  formatDateOnly,
  getConstructionInitials,
  getHouseConfigurationInitialState,
  toHouseConfigurationInput,
} from '@/components/construction-site/ui/lib/view-model.ts';

export function HouseConfigurationScreen({
  constructionSite,
  house,
  onSave,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord | null;
  onSave(input: CreateHouseInput): void | Promise<void>;
}) {
  const form = useForm<HouseConfigurationFormValues>({
    resolver: zodResolver(houseConfigurationFormSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: getHouseConfigurationInitialState(constructionSite, house),
  });
  const locationQuery = form.watch('locationQuery');

  useEffect(() => {
    form.reset(getHouseConfigurationInitialState(constructionSite, house));
  }, [house, constructionSite, form]);

  const submitForm = form.handleSubmit(async (values) => {
    await onSave(toHouseConfigurationInput(values));
  });

  return (
    <form
      data-testid='house-configuration-form'
      className='grid gap-6 sm:grid-cols-[220px_minmax(0,1fr)]'
      onSubmit={submitForm}
      noValidate
    >
      <HouseConfigurationSidebar constructionSite={constructionSite}/>

      <div className='space-y-6'>
        <HouseFormSection number='01' title='Detalhes da Família'>
          <div className='space-y-5'>
            <Controller
              control={form.control}
              name='familyPhotoDataUrl'
              render={({field}) => (
                <PhotoUploadField
                  label='Foto da Família'
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  loadedDropZoneClassName='h-72'
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
                      error={fieldState.error?.message}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        </HouseFormSection>

        <HouseFormSection number='02' title='Sobre a Casa'>
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
                  />
                )}
              />
            </div>
          </div>
        </HouseFormSection>

        <HouseFormSection number='03' title='Restrições Locais'>
          <div data-testid='local-restrictions-grid' className='grid gap-6 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='soilProfile'
              render={({field}) => (
                <fieldset className='space-y-3'>
                  <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Perfil do Solo</legend>
                  <div className='space-y-3'>
                    <RadioField
                      icon={<Mountain className='h-5 w-5'/>}
                      label='Terreno Estável / Firme'
                      name='soilProfile'
                      value='stable'
                      checked={field.value === 'stable'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                    <RadioField
                      icon={<Waves className='h-5 w-5'/>}
                      label='Solo Aluvial Solto / Argila'
                      name='soilProfile'
                      value='loose_clay'
                      checked={field.value === 'loose_clay'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                    <RadioField
                      icon={<Droplets className='h-5 w-5'/>}
                      label='Lençol Freático / Água no Fundo'
                      name='soilProfile'
                      value='water_table'
                      checked={field.value === 'water_table'}
                      onChange={(soilProfile) => field.onChange(soilProfile as SoilProfile)}
                    />
                  </div>
                </fieldset>
              )}
            />

            <fieldset className='space-y-3'>
              <legend className='text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500'>Obstáculos no Local</legend>
              <div className='space-y-3'>
                <Controller
                  control={form.control}
                  name='hasUndergroundObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Subterrâneos'
                      description='Canos, raízes ou caliças (entulhos e concretos)'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasElevatedObstacles'
                  render={({field}) => (
                    <CheckboxField
                      label='Obstáculos Elevados'
                      description='Árvores ou fios de tensão'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <Controller
                  control={form.control}
                  name='hasNeighborSetbacks'
                  render={({field}) => (
                    <CheckboxField
                      label='Servidões Vizinhas'
                      description='Recuos rígidos de limites'
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </fieldset>
          </div>
        </HouseFormSection>

        <HouseFormSection number='04' title='Características do Local'>
          <div data-testid='site-characteristics-grid' className='grid gap-4 md:grid-cols-2'>
            <Controller
              control={form.control}
              name='locationQuery'
              render={({field, fieldState}) => (
                <TextField
                  label='Localização Geográfica'
                  placeholder='Carregar a partir de coordenadas'
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={form.control}
              name='terrainComplexity'
              render={({field, fieldState}) => (
                <VisualSelectField
                  label='Complexidade do Terreno'
                  ariaLabel='Complexidade do Terreno'
                  value={field.value}
                  options={TERRAIN_COMPLEXITY_OPTIONS}
                  onChange={(terrainComplexity) => field.onChange(terrainComplexity)}
                  error={fieldState.error?.message}
                />
              )}
            />
            <div data-testid='static-map-wrapper' className='md:col-span-2'>
              <StaticMapPreview locationQuery={locationQuery}/>
            </div>
          </div>
        </HouseFormSection>

        <div className='grid gap-4 md:grid-cols-2'>
          <PrimaryButton type='submit' className='w-full md:col-start-2'>Salvar Configurações</PrimaryButton>
        </div>
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
          <dd className='mt-1 text-sm font-medium leading-5 text-slate-600'>{communityLabel}</dd>
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
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className='space-y-4 py-2'>
      <div className='mb-4 flex items-center gap-3'>
        <span className='grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white'>
          {number}
        </span>
        <h2 className='text-base font-semibold text-slate-950'>{title}</h2>
      </div>
      <div className='space-y-4'>{children}</div>
    </section>
  );
}
