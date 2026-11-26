import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertButton, AlertController, AlertOptions, provideIonicAngular, SelectCustomEvent } from '@ionic/angular';

import { ViewExpensesPage } from './view-expenses.page';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';

describe('ViewExpensesPage', () => {
  let component: ViewExpensesPage;
  let fixture: ComponentFixture<ViewExpensesPage>;
  let alertOptions: AlertOptions | undefined;

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
  const confirm = (text: 'Delete' | 'Cancel') =>
    (alertOptions!.buttons as AlertButton[]).find(b => b.text === text)!.handler!(undefined);

  beforeEach(async () => {
    localStorage.setItem('expenses', JSON.stringify(saved));
    alertOptions = undefined;
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
