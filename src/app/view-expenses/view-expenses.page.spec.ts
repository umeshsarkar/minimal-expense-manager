import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertButton, AlertController, AlertOptions, provideIonicAngular } from '@ionic/angular';

import { ViewExpensesPage } from './view-expenses.page';
import { ExpenseService } from '../service/expense.service';
import { Expense } from '../model/expense.model';

describe('ViewExpensesPage', () => {
  let component: ViewExpensesPage;
  let fixture: ComponentFixture<ViewExpensesPage>;
  let alertOptions: AlertOptions | undefined;

  const saved: Expense[] = [
    { name: 'Coffee', date: '1.2.2026', category: 'Food', amount: 3.5 },
    { name: 'Bus', date: '2.2.2026', category: 'Transport', amount: 2 },
  ];

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

    fixture = TestBed.createComponent(ViewExpensesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => localStorage.clear());

  it('lists saved expenses with the total', () => {
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(component.expenses).toEqual(saved);
    expect(component.totalExpense).toBe(5.5);
    expect(text).toContain('Coffee');
    expect(text).toContain('Bus');
    expect(text).toContain('Total Expenses: 5.5 €');
  });

  it('deletes an expense after confirming the alert', async () => {
    await component.deleteExpense(0);
    expect(alertOptions?.message).toContain('"Coffee"');

    const deleteButton = (alertOptions!.buttons as AlertButton[]).find(b => b.text === 'Delete')!;
    await deleteButton.handler!(undefined);

    expect(component.expenses.map(e => e.name)).toEqual(['Bus']);
    expect(component.totalExpense).toBe(2);
    expect(TestBed.inject(ExpenseService).getExpenses().map(e => e.name)).toEqual(['Bus']);
  });

  it('keeps the expense when the alert is cancelled', async () => {
    await component.deleteExpense(0);
    const cancel = (alertOptions!.buttons as AlertButton[]).find(b => b.role === 'cancel')!;
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    cancel.handler!(undefined);

    expect(component.expenses.length).toBe(2);
  });
});
