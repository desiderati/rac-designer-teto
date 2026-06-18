import {type KeyboardEvent, type ReactNode, useEffect, useState} from 'react';
import {Controller, useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {Droplets, Layers, LoaderCircle, LocateFixed, Waves} from 'lucide-react';
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
import {
  formatDateOnly,
  getConstructionInitials,
  getHouseConfigurationInitialState,
  toHouseConfigurationInput,
} from '@/components/construction-site/ui/lib/view-model.ts';
import {useFormDirtyChange} from '@/components/construction-site/ui/lib/use-form-dirty-change.ts';

export function HouseConfigurationScreen({
  constructionSite,
  house,
  onSave,
  onDirtyChange,
}: {
  mode: 'create' | 'edit';
  constructionSite: ConstructionSiteState;
  house: PersistedHouseRecord | null;
  onSave(input: CreateHouseInput): void | Promise<void>;
  onDirtyChange?: (isDirty: boolean) => void;
}) {
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
  const locationQuery = form.watch('locationQuery');

  useEffect(() => {
    form.reset(getHouseConfigurationInitialState(constructionSite, house));
    setLocationLookupStatus('idle');
    setLocationLookupMessage(null);
  }, [house, constructionSite, form]);
  useFormDirtyChange(form.formState.isDirty, onDirtyChange);

  const submitForm = form.handleSubmit(async (values) => {
    await onSave(toHouseConfigurationInput(values));
  });

  const useCurrentLocation = () => {
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
                      maxLength={HOUSE_PRIMARY_CONTACT_EMAIL_MAX_LENGTH}
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

            <fieldset className='min-w-0 space-y-3'>
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
                      description='Recuos rígidos de limites (esquadro apertado)'
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
                <div className='space-y-2 md:col-span-2'>
                  <div
                    data-testid='location-geography-row'
                    className='grid gap-4 md:grid-cols-2 md:items-start'
                  >
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
                    />
                    <button
                      type='button'
                      aria-describedby={locationLookupMessage ? 'current-location-feedback' : undefined}
                      className={cn(
                        buttonClassName,
                        'w-full gap-2 border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 md:mt-[1.45rem]',
                      )}
                      onClick={useCurrentLocation}
                      disabled={locationLookupStatus === 'loading'}
                    >
                      {locationLookupStatus === 'loading'
                        ? <LoaderCircle className='h-4 w-4 animate-spin'/>
                        : <LocateFixed className='h-4 w-4'/>}
                      {locationLookupStatus === 'loading' ? 'Obtendo localização...' : 'Usar localização atual'}
                    </button>
                  </div>
                  {locationLookupMessage ? (
                    <p
                      id='current-location-feedback'
                      role={locationLookupMessage.tone === 'error' ? 'alert' : 'status'}
                      className={cn(
                        'text-xs font-medium',
                        locationLookupMessage.tone === 'error' ? 'text-red-600' : 'text-blue-700',
                      )}
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
            <div data-testid='site-actions-grid' className='grid gap-4 md:col-span-2 md:grid-cols-2'>
              <PrimaryButton type='submit' className='w-full md:col-start-2'>Salvar Configurações</PrimaryButton>
            </div>
          </div>
        </HouseFormSection>
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
