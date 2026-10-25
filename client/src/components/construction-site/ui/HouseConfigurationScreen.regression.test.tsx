import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createConstructionSiteSession} from '@/components/rac-editor/lib/construction-site-session.ts';
import {HouseConfigurationScreen} from './HouseConfigurationScreen.tsx';
import type {CreateHouseInput} from '@/components/rac-editor/lib/construction-site-session.ts';

const uploadImage = vi.hoisted(() => vi.fn());
vi.mock('@/contexts/useStorageImageUpload.ts', () => ({
  useStorageImageUpload: () => ({isUploading: false, uploadImage}),
}));
vi.mock('@/components/ui/ProtectedImage.tsx', () => ({
  ProtectedImage: ({src, alt}: {src?: string; alt?: string}) => <img src={src} alt={alt}/>,
}));

const PHOTO_URL = '/api/private-storage/rac-designer-teto/unassigned/photos/familia_1234.png';
const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeSession() {
  const session = createConstructionSiteSession({read: () => ({version: 1, constructionSites: []}), write: vi.fn()});
  session.createConstructionSite({externalCode: 'CC2610', constructionDate: '2026-10-31', communityName: 'Comunidade teste'});
  return session;
}

function fillIdentity() {
  fireEvent.change(screen.getByLabelText('Nome da Família'), {target: {value: 'Família teste'}});
  fireEvent.change(screen.getByLabelText('Contato Principal'), {target: {value: 'Contato teste'}});
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  uploadImage.mockReset();
});

describe('Regressão de salvamento da casa', () => {
  it('cria e reabre casa com a URL privada retornada pelo upload', async () => {
    uploadImage.mockResolvedValue(PHOTO_URL);
    vi.stubGlobal('URL', {...URL, createObjectURL: () => 'blob:preview', revokeObjectURL: vi.fn()});
    const session = makeSession();
    const onSave = vi.fn((input: CreateHouseInput) => {session.createHouse(input);});
    render(<HouseConfigurationScreen mode='create' constructionSite={session.getConstructionSite()!} house={null} onSave={onSave}/>);
    fillIdentity();
    fireEvent.change(screen.getByLabelText('Foto da Família arquivo'), {
      target: {files: [new File([PNG_BYTES], 'familia.png', {type: 'image/png'})]},
    });
    const review = await screen.findByRole('dialog');
    await waitFor(() => expect(review.querySelector('img')).not.toBeNull());
    fireEvent.click(within(review).getByRole('button', {name: 'Usar esta imagem'}));
    await waitFor(() => expect(uploadImage).toHaveBeenCalledOnce());
    await waitFor(() => expect(within(screen.getByTestId('family-photo-field')).getAllByAltText('Foto da Família').some((image) => image.getAttribute('src') === PHOTO_URL)).toBe(true));
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Configurações'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({familyPhotoDataUrl: PHOTO_URL}));
    const document = {version: 1, constructionSites: session.getConstructionSiteSnapshots()};
    const reopened = createConstructionSiteSession({read: () => document, write: vi.fn()});
    expect(reopened.getConstructionSite()!.families[0].photoDataUrl).toBe(PHOTO_URL);
  });

  it('mostra erro da foto e feedback ao salvar com a seção recolhida', async () => {
    const session = makeSession();
    const house = session.createHouse({familyName: 'Família teste', primaryContactName: 'Contato teste'});
    const site = session.getConstructionSite()!;
    site.families[0].photoDataUrl = 'https://invalid.example/photo.png';
    const onSave = vi.fn();
    render(<HouseConfigurationScreen mode='edit' constructionSite={site} house={house} onSave={onSave}/>);
    fireEvent.click(screen.getByRole('button', {name: 'Alternar seção Detalhes da Família'}));
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Configurações'}));
    expect(await screen.findByText('Use um arquivo PNG, JPG ou WEBP válido.')).toBeVisible();
    expect(screen.getByRole('button', {name: 'Foto da Família'})).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Revise os campos indicados antes de salvar.')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('salva sem foto e sem abrir as seções opcionais no celular', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn()} as unknown as MediaQueryList));
    const session = makeSession();
    const onSave = vi.fn();
    render(<HouseConfigurationScreen mode='create' constructionSite={session.getConstructionSite()!} house={null} onSave={onSave}/>);
    fillIdentity();
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Configurações'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
  });

  it('informa falha assíncrona, mantém o preenchimento e permite tentar novamente', async () => {
    let rejectSave!: (error: Error) => void;
    const onSave = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {rejectSave = reject;}));
    const session = makeSession();
    render(<HouseConfigurationScreen mode='create' constructionSite={session.getConstructionSite()!} house={null} onSave={onSave}/>);
    fillIdentity();
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Configurações'}));
    await waitFor(() => expect(screen.getByRole('button', {name: 'Salvando...'})).toBeDisabled());
    rejectSave(new Error('Falha de teste'));
    expect(await screen.findByText('Não foi possível salvar a casa. Seus dados foram mantidos. Tente novamente.')).toBeVisible();
    expect(screen.getByLabelText('Nome da Família')).toHaveValue('Família teste');
    fireEvent.click(screen.getByRole('button', {name: 'Salvar Configurações'}));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Não foi possível salvar a casa/)).not.toBeInTheDocument();
  });
});
