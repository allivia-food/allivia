import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import type { Profile } from '@/services/profile';
import type { Recipe, SavedRecipe } from '@/services/recipes';
import { useProfileStore } from '@/store/profile';
import { useRecipeFiltersStore } from '@/store/recipeFilters';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
  useLocalSearchParams: () => mockParams,
  useFocusEffect: jest.fn(),
}));
const mockRouter = jest.requireMock('expo-router').router as Record<string, jest.Mock>;

const mockSearch = jest.fn();
const mockGet = jest.fn();
const mockSaved = jest.fn();
const mockSave = jest.fn();
const mockUnsave = jest.fn();
jest.mock('@/services/restaurants', () => ({
  getRestaurants: async () => [],
  getSavedRestaurants: async () => [],
  saveRestaurant: async () => undefined,
  unsaveRestaurant: async () => undefined,
}));

jest.mock('@/services/recipes', () => ({
  searchRecipes: (...a: unknown[]) => mockSearch(...a),
  getRecipe: (...a: unknown[]) => mockGet(...a),
  getSavedRecipes: (...a: unknown[]) => mockSaved(...a),
  saveRecipe: (...a: unknown[]) => mockSave(...a),
  unsaveRecipe: (...a: unknown[]) => mockUnsave(...a),
}));

import HomeScreen from '@/app/(tabs)/home';
import RecipesScreen from '@/app/(tabs)/recipes';
import RecipeScreen from '@/app/recipe/[id]';
import SavedScreen from '@/app/saved';

const recipe = (id: string, over: Partial<Recipe> = {}): Recipe => ({
  id,
  title: `Receita ${id}`,
  description: null,
  imageUrl: null,
  mealTypes: ['lunch'],
  readyInMinutes: 20,
  servings: 2,
  ingredients: ['1 cenoura', 'sal'],
  steps: ['Misture.', 'Sirva.'],
  allergens: [],
  diets: ['lactose_free'],
  caloriesKcal: 300,
  proteinG: 30,
  carbsG: 20,
  fatG: 10,
  tip: null,
  allergensReviewed: true,
  featured: false,
  ...over,
});

const profile: Profile = {
  id: 'u1',
  email: 'ana@exemplo.com',
  displayName: 'Ana',
  allergies: ['milk', 'gluten', 'egg', 'soy'],
  customAllergies: [],
  preferences: [],
  onboardingCompleted: true,
  onboardingStep: 3,
  isPremium: false,
};

function renderWithClient(ui: ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  useProfileStore.getState().setProfile(profile);
  useRecipeFiltersStore.getState().setFilters(null);
  mockSaved.mockResolvedValue([]);
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('Receitas', () => {
  it('shows the featured recipe and the list, with the profile "without" text', async () => {
    mockSearch.mockResolvedValue([recipe('1'), recipe('2'), recipe('3')]);
    await renderWithClient(<RecipesScreen />);
    expect(await screen.findByTestId('recipe-featured')).toBeTruthy();
    expect(screen.getByText('Sem leite, sem ovo, sem glúten, sem soja')).toBeTruthy();
    expect(screen.getByText('Receita 2')).toBeTruthy();
    expect(screen.getByText('Receita 3')).toBeTruthy();
  });

  it('a meal chip reloads the search with that meal type', async () => {
    mockSearch.mockResolvedValue([recipe('1')]);
    await renderWithClient(<RecipesScreen />);
    await screen.findByTestId('recipe-featured');
    await fireEvent.press(screen.getByTestId('meal-dinner'));
    expect(mockSearch).toHaveBeenLastCalledWith(expect.objectContaining({ mealType: 'dinner' }), 0);
  });

  it('empty result offers "Limpar filtros"', async () => {
    mockSearch.mockResolvedValue([]);
    useRecipeFiltersStore.getState().setFilters({
      mealType: 'dessert',
      time: null,
      diets: [],
      include: [],
      exclude: [],
    });
    await renderWithClient(<RecipesScreen />);
    expect(await screen.findByText('Nenhuma receita encontrada com esses filtros.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(useRecipeFiltersStore.getState().filters?.mealType).toBeNull();
  });

  it('search error shows the message and retry', async () => {
    mockSearch.mockRejectedValue(new Error('boom'));
    await renderWithClient(<RecipesScreen />);
    expect(
      await screen.findByText('Não foi possível carregar as receitas. Tente novamente.'),
    ).toBeTruthy();
  });

  it('filters: apply updates the counter and persists in the store; "Limpar" resets', async () => {
    mockSearch.mockResolvedValue([recipe('1')]);
    await renderWithClient(<RecipesScreen />);
    await screen.findByTestId('recipe-featured');
    await fireEvent.press(screen.getByTestId('recipes-filter'));
    await fireEvent.press(screen.getByTestId('filter-time-from15to30'));
    await fireEvent.changeText(screen.getByTestId('filter-include-input'), 'Cebola');
    await fireEvent.press(screen.getByTestId('filter-include-add'));
    await fireEvent.press(screen.getByTestId('filters-apply'));
    expect(screen.getByRole('button', { name: 'Filtros (2)' })).toBeTruthy();
    expect(useRecipeFiltersStore.getState().filters).toMatchObject({
      time: 'from15to30',
      include: ['Cebola'],
    });
    await fireEvent.press(screen.getByTestId('recipes-filter'));
    await fireEvent.press(screen.getByTestId('filters-clear'));
    await fireEvent.press(screen.getByTestId('filters-apply'));
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeTruthy();
  });
});

describe('Receitas: faixa de tempo', () => {
  it('never shows a recipe outside "15-30 min", even if the server returned one', async () => {
    useRecipeFiltersStore.getState().setFilters({
      mealType: null,
      time: 'from15to30',
      diets: [],
      include: [],
      exclude: [],
    });
    mockSearch.mockResolvedValue([
      recipe('15', { readyInMinutes: 15 }),
      recipe('20', { readyInMinutes: 20 }),
      recipe('30', { readyInMinutes: 30 }),
      recipe('45', { readyInMinutes: 45 }),
    ]);
    await renderWithClient(<RecipesScreen />);
    expect(await screen.findByText('Receita 20')).toBeTruthy();
    expect(screen.getByText('Receita 30')).toBeTruthy();
    expect(screen.queryByText('Receita 15')).toBeNull();
    expect(screen.queryByText('Receita 45')).toBeNull();
  });
});

describe('Receita aberta', () => {
  it('shows the green banner only when safe, always with the disclaimer', async () => {
    mockParams = { id: '1' };
    mockGet.mockResolvedValue(recipe('1'));
    await renderWithClient(<RecipeScreen />);
    expect(await screen.findByTestId('safety-safe')).toBeTruthy();
    expect(screen.getByText('Segura para você!')).toBeTruthy();
    expect(screen.getByText(/Sempre leia os ingredientes e rótulos/)).toBeTruthy();
    expect(screen.getByText('Rica em proteínas')).toBeTruthy();
    expect(screen.queryByText(/Dificuldade/)).toBeNull();
  });

  it('a synonym in the ingredients turns the banner red', async () => {
    mockParams = { id: '1' };
    mockGet.mockResolvedValue(recipe('1', { ingredients: ['2 colheres de manteiga'] }));
    await renderWithClient(<RecipeScreen />);
    expect(await screen.findByTestId('safety-danger')).toBeTruthy();
    expect(screen.getByText('Atenção! Esta receita pode conter: Leite')).toBeTruthy();
    expect(screen.queryByText(/Segura/)).toBeNull();
    expect(screen.getByText(/Sempre leia os ingredientes e rótulos/)).toBeTruthy();
  });

  it('a recipe not reviewed is yellow', async () => {
    mockParams = { id: '1' };
    mockGet.mockResolvedValue(recipe('1', { allergensReviewed: false }));
    await renderWithClient(<RecipeScreen />);
    expect(await screen.findByTestId('safety-warning')).toBeTruthy();
    expect(screen.getByText(/Sempre leia os ingredientes e rótulos/)).toBeTruthy();
  });

  it('unknown or unpublished recipe shows "Não encontramos esta receita."', async () => {
    mockParams = { id: 'x' };
    mockGet.mockResolvedValue(null);
    await renderWithClient(<RecipeScreen />);
    expect(await screen.findByText('Não encontramos esta receita.')).toBeTruthy();
  });

  it('saving updates the bookmark at once (optimistic)', async () => {
    mockParams = { id: '1' };
    mockGet.mockResolvedValue(recipe('1'));
    mockSave.mockImplementation(async () => {
      mockSaved.mockResolvedValue([{ recipe: recipe('1'), savedAt: '2026-10-01' }]);
    });
    await renderWithClient(<RecipeScreen />);
    await screen.findByTestId('safety-safe');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar receita' }));
    expect(await screen.findByRole('button', { name: 'Remover dos salvos' })).toBeTruthy();
    expect(mockSave).toHaveBeenCalledWith('u1', '1');
  });

  it('a failed save reverts the bookmark and shows the message', async () => {
    mockParams = { id: '1' };
    mockGet.mockResolvedValue(recipe('1'));
    mockSave.mockRejectedValue(new Error('db'));
    await renderWithClient(<RecipeScreen />);
    await screen.findByTestId('safety-safe');
    await fireEvent.press(screen.getByRole('button', { name: 'Salvar receita' }));
    expect(await screen.findByText('Não foi possível salvar agora.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Salvar receita' })).toBeTruthy();
  });
});

describe('Seus salvos', () => {
  it('removing shows "Receita removida" and "Desfazer" saves it again', async () => {
    const saved: SavedRecipe[] = [{ recipe: recipe('1'), savedAt: '2026-10-01' }];
    mockSaved.mockResolvedValue(saved);
    mockUnsave.mockResolvedValue(undefined);
    mockSave.mockResolvedValue(undefined);
    await renderWithClient(<SavedScreen />);
    expect(await screen.findByText('Receita 1')).toBeTruthy();
    mockSaved.mockResolvedValue([]);
    await fireEvent.press(screen.getByRole('button', { name: 'Remover dos salvos' }));
    expect(await screen.findByText('Receita removida')).toBeTruthy();
    await fireEvent.press(screen.getByText('Desfazer'));
    expect(mockSave).toHaveBeenCalledWith('u1', '1');
  });

  it('empty states of both tabs', async () => {
    await renderWithClient(<SavedScreen />);
    expect(await screen.findByText('Todas as receitas salvas aparecerão aqui.')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('saved-tab-restaurants'));
    expect(await screen.findByText('Todos os restaurantes salvos aparecerão aqui.')).toBeTruthy();
  });
});

describe('Home', () => {
  it('greets by name, shows restrictions with +N and the recipe with the safe description', async () => {
    mockSearch.mockResolvedValue([recipe('9')]);
    await renderWithClient(<HomeScreen />);
    expect(screen.getByText('Olá, Ana! 👋')).toBeTruthy();
    expect(screen.getByText('Leite')).toBeTruthy();
    expect(screen.getByText('+2')).toBeTruthy();
    expect(await screen.findByText('Simples, nutritivo e livre dos seus alergênicos')).toBeTruthy();
    expect(screen.queryByTestId('home-restaurants')).toBeNull();
    await fireEvent.press(screen.getByTestId('home-see-recipe'));
    expect(mockRouter.push).toHaveBeenCalledWith('/recipe/9');
  });

  it('a recipe that is not safe gets "Confira os ingredientes"', async () => {
    mockSearch.mockResolvedValue([recipe('9', { allergensReviewed: false })]);
    await renderWithClient(<HomeScreen />);
    expect(await screen.findByText('Confira os ingredientes')).toBeTruthy();
  });

  it('shortcuts open the scanner, the restrictions editor and the saved list', async () => {
    mockSearch.mockResolvedValue([]);
    await renderWithClient(<HomeScreen />);
    await act(async () => {});
    await fireEvent.press(screen.getByTestId('home-scanner'));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/scanner');
    await fireEvent.press(screen.getByTestId('home-edit-restrictions'));
    expect(mockRouter.push).toHaveBeenCalledWith('/profile/edit-preferences');
    await fireEvent.press(screen.getByTestId('home-saved'));
    expect(mockRouter.push).toHaveBeenCalledWith('/saved');
  });
});
