import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  AlertButton, AlertController, AlertOptions, ModalController, ModalOptions, provideIonicAngular, SearchbarCustomEvent,
  SelectCustomEvent,
} from '@ionic/angular';

import { ALL_CATEGORIES, ViewExpensesPage } from './view-expenses.page';
import { EditExpenseModalComponent } from './edit-expense-modal/edit-expense-modal.component';
import { StorageService } from '../service/storage.service';
import { FakeStorageService } from '../testing/fake-storage.service';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';

describe('ViewExpensesPage', () => {
  let component: ViewExpensesPage;
  let fixture: ComponentFixture<ViewExpensesPage>;
  let alertOptions: AlertOptions | undefined;
  let modalOptions: ModalOptions | undefined;
  let modalResult: { data?: unknown; role?: string };
  let storage: FakeStorageService;

  // Stored in the order they were added.
  const saved: Expense[] = [
    { name: 'Coffee', date: '1.2.2026', category: 'Food', amount: 3.5 },
    { name: 'Bus', date: '2.2.2026', category: 'Transport', amount: 2 },
    { name: 'Rent', date: '28.1.2026', category: 'Home', amount: 800 },
  ];

  async function createPage() {
    fixture = TestBed.createComponent(ViewExpensesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  const names = () => component.expenses.map(e => e.name);
  const renderedNames = () =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('ion-list ion-item p:first-of-type')).map(
      p => p.textContent?.trim(),
    );
  const sortBy = (value: string) => component.onSortChange({ detail: { value } } as SelectCustomEvent);
  const filterCategory = (value: string) => component.onCategoryChange({ detail: { value } } as SelectCustomEvent);
  const search = (value: string) => component.onSearch({ detail: { value } } as SearchbarCustomEvent);
  const pageText = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const confirm = (text: 'Delete' | 'Cancel') =>
    (alertOptions!.buttons as AlertButton[]).find(b => b.text === text)!.handler!(undefined);

  beforeEach(async () => {
    localStorage.setItem('expenses', JSON.stringify(saved));
    alertOptions = undefined;
    modalOptions = undefined;
    modalResult = { role: 'cancel' };
    storage = new FakeStorageService();
    const modalController = {
      create: vi.fn(async (opts: ModalOptions) => {
        modalOptions = opts;
        return {
          present: vi.fn().mockResolvedValue(undefined),
          onDidDismiss: vi.fn(async () => modalResult),
        };
      }),
    };
    const alertController = {
      create: vi.fn(async (opts: AlertOptions) => {
        alertOptions = opts;
        return { present: vi.fn().mockResolvedValue(undefined) };
      }),
    };

    await TestBed.configureTestingModule({
      imports: [ViewExpensesPage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        { provide: AlertController, useValue: alertController },
        { provide: ModalController, useValue: modalController },
        { provide: StorageService, useValue: storage },
      ],
    }).compileComponents();
  });

  afterEach(() => localStorage.clear());

  it('lists saved expenses with the total', async () => {
    await createPage();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(component.totalExpense).toBe(805.5);
    expect(text).toContain('Coffee');
    expect(text).toContain('Bus');
    expect(text).toContain('Rent');
    expect(text).toContain('Total Expenses: 805.5 €');
  });

  it('rounds the total to cents (no floating-point noise)', async () => {
    await createPage();
    // 64.3 + 49 + 39.99 + 120 in floating point:
    component.totalExpense = 64.3 + 49 + 39.99 + 120;
    expect(component.totalExpense).not.toBe(273.29);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Total Expenses: 273.29 €');
  });

  describe('sorting', () => {
    it('shows the newest expenses first by default', async () => {
      await createPage();
      expect(component.sortOption).toBe('newest');
      expect(names()).toEqual(['Bus', 'Coffee', 'Rent']);
      expect(renderedNames()).toEqual(['Bus', 'Coffee', 'Rent']);
    });

    it('re-sorts the list when another option is picked', async () => {
      await createPage();

      sortBy('oldest');
      fixture.detectChanges();
      expect(renderedNames()).toEqual(['Rent', 'Coffee', 'Bus']);

      sortBy('amount-desc');
      expect(names()).toEqual(['Rent', 'Coffee', 'Bus']);

      sortBy('amount-asc');
      fixture.detectChanges();
      expect(renderedNames()).toEqual(['Bus', 'Coffee', 'Rent']);
    });

    it('remembers the chosen sort for next time', async () => {
      await createPage();
      sortBy('amount-desc');
      fixture.destroy();

      await createPage();
      expect(component.sortOption).toBe('amount-desc');
      expect(names()).toEqual(['Rent', 'Coffee', 'Bus']);
    });

    it('ignores unknown sort values', async () => {
      await createPage();
      sortBy('name');
      expect(component.sortOption).toBe('newest');
      expect(names()).toEqual(['Bus', 'Coffee', 'Rent']);
    });

    it('shows a newly added expense at the top', async () => {
      TestBed.inject(ExpenseService).addExpense({ name: 'Lunch', date: '3.2.2026', category: 'Food', amount: 9 });
      await createPage();
      expect(names()[0]).toBe('Lunch');
    });

    it('hides the sort control when there is nothing to sort', async () => {
      localStorage.setItem('expenses', JSON.stringify([saved[0]]));
      await createPage();
      expect((fixture.nativeElement as HTMLElement).querySelector('ion-select')).toBeNull();
    });
  });

  describe('filtering and search', () => {
    it('shows only the chosen category and totals just those', async () => {
      await createPage();
      expect(component.categories).toEqual(['Food', 'Home', 'Transport']);

      filterCategory('Food');
      fixture.detectChanges();

      expect(names()).toEqual(['Coffee']);
      expect(component.totalExpense).toBe(3.5);
      expect(pageText()).toContain('Filtered total: 3.5 €');
      expect(pageText()).toContain('of 805.5 € in total');

      filterCategory(ALL_CATEGORIES);
      fixture.detectChanges();
      expect(names()).toEqual(['Bus', 'Coffee', 'Rent']);
      expect(pageText()).toContain('Total Expenses: 805.5 €');
    });

    it('searches by name, case-insensitively', async () => {
      await createPage();
      search('BU');
      expect(names()).toEqual(['Bus']);
      expect(component.totalExpense).toBe(2);
    });

    it('combines search with the category filter and offers to clear them', async () => {
      await createPage();
      filterCategory('Home');
      search('coffee');
      fixture.detectChanges();

      expect(names()).toEqual([]);
      expect(pageText()).toContain('No expenses match your search.');

      component.clearFilters();
      fixture.detectChanges();
      expect(names()).toEqual(['Bus', 'Coffee', 'Rent']);
      expect(pageText()).not.toContain('No expenses match');
    });

    it('drops the category filter when its last expense is deleted', async () => {
      await createPage();
      filterCategory('Home');
      await component.deleteExpense(component.expenses[0]);
      await confirm('Delete');

      expect(component.filter.category).toBeNull();
      expect(names()).toEqual(['Bus', 'Coffee']);
    });
  });

  describe('month groups', () => {
    it('groups by month with subtotals when sorted by date', async () => {
      await createPage();
      fixture.detectChanges();

      expect(component.groups.map(g => [g.label, g.total])).toEqual([
        ['February 2026', 5.5],
        ['January 2026', 800],
      ]);
      const dividers = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('ion-item-divider')).map(d => [
        d.querySelector('ion-label')?.textContent?.trim(),
        d.querySelector('ion-note')?.textContent?.trim(),
      ]);
      expect(dividers).toEqual([
        ['February 2026', '5.5 €'],
        ['January 2026', '800 €'],
      ]);
    });

    it('shows a flat list when sorted by amount', async () => {
      await createPage();
      sortBy('amount-desc');
      fixture.detectChanges();

      expect(component.groups.length).toBe(1);
      expect(component.groups[0].label).toBeNull();
      expect((fixture.nativeElement as HTMLElement).querySelector('ion-item-divider')).toBeNull();
    });
  });

  describe('editing', () => {
    it('opens the edit dialog with the expense and the stored categories', async () => {
      await storage.setItem('category', JSON.stringify(['Food', 'Gym']));
      await createPage();
      const bus = component.expenses[0];

      await component.editExpense(bus);

      expect(modalOptions?.component).toBe(EditExpenseModalComponent);
      expect(modalOptions?.componentProps).toEqual({ expense: bus, categories: ['Food', 'Gym'] });
    });

    it('saves the changes in place and re-sorts', async () => {
      await createPage();
      const coffee = component.expenses.find(e => e.name === 'Coffee')!;
      modalResult = { role: 'save', data: { name: 'Espresso', date: '5.2.2026', category: 'Food', amount: 4 } };

      await component.editExpense(coffee);
      fixture.detectChanges();

      expect(names()).toEqual(['Espresso', 'Bus', 'Rent']);
      expect(component.totalExpense).toBe(806);
      // Same stored position as before (Coffee was added first).
      expect(TestBed.inject(ExpenseService).getExpenses().map(e => e.name)).toEqual(['Espresso', 'Bus', 'Rent']);
      expect(JSON.parse(localStorage.getItem('expenses')!)[0].name).toBe('Espresso');
    });

    it('changes nothing when the dialog is cancelled', async () => {
      await createPage();
      await component.editExpense(component.expenses[0]);
      expect(names()).toEqual(['Bus', 'Coffee', 'Rent']);
      expect(JSON.parse(localStorage.getItem('expenses')!)).toEqual(saved);
    });

    it('tapping the delete button does not open the edit dialog', async () => {
      await createPage();
      fixture.detectChanges();
      const deleteButton = (fixture.nativeElement as HTMLElement).querySelector('.delete-button') as HTMLElement;

      deleteButton.click();
      await fixture.whenStable();

      expect(alertOptions?.message).toContain('"Bus"');
      expect(modalOptions).toBeUndefined();
    });
  });

  describe('deleting', () => {
    it('deletes the expense that was tapped, even when the list is sorted', async () => {
      await createPage();
      sortBy('amount-desc'); // Rent, Coffee, Bus. Stored order is Coffee, Bus, Rent.

      const coffee = component.expenses[1];
      await component.deleteExpense(coffee);
      expect(alertOptions?.message).toContain('"Coffee"');
      await confirm('Delete');

      expect(names()).toEqual(['Rent', 'Bus']);
      expect(component.totalExpense).toBe(802);
      expect(TestBed.inject(ExpenseService).getExpenses().map(e => e.name)).toEqual(['Bus', 'Rent']);
    });

    it('keeps the expense when the alert is cancelled', async () => {
      await createPage();
      await component.deleteExpense(component.expenses[0]);
      vi.spyOn(console, 'log').mockImplementation(() => undefined);
      await confirm('Cancel');

      expect(component.expenses.length).toBe(3);
    });
  });
});
