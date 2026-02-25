export interface HouseElementsRepository<TElement extends { id: string }> {

  getElements(): TElement[];

  setElements(elements: TElement[]): void;

}
