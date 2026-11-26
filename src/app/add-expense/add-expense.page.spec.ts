import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ModalController, provideIonicAngular, ToastController } from '@ionic/angular';

import { AddExpensePage } from './add-expense.page';
import { ExpenseService } from '../service/expense.service';
import { StorageService } from '../service/storage.service';
import { FakeStorageService } from '../testing/fake-storage.service';

describe('AddExpensePage', () => {
  let component: AddExpensePage;
  let fixture: ComponentFixture<AddExpensePage>;
  let storage: FakeStorageService;
  let toast: { create: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    storage = new FakeStorageService();
    toast = { create: vi.fn().mockResolvedValue({ present: vi.fn().mockResolvedValue(undefined) }) };

    await TestBed.configureTestingModule({
      imports: [AddExpensePage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        { provide: StorageService, useValue: storage },
        { provide: ToastController, useValue: toast },
        { provide: ModalController, useValue: { create: vi.fn() } },
      ],
    }).compileComponents();
  });

  async function createComponent() {
    fixture = TestBed.createComponent(AddExpensePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('should create', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('pre-fills today\'s date', async () => {
    await createComponent();
    expect(component.date).toBe(new Date().toLocaleDateString('de'));
  });

  it('uses the default categories when none are stored', async () => {
    await createComponent();
    expect(component.categoryList).toEqual(['Food', 'Internet', 'Transport', 'Car']);
  });

  it('loads stored categories', async () => {
    await storage.setItem('category', JSON.stringify(['Rent', 'Gym']));
    await createComponent();
    expect(component.categoryList).toEqual(['Rent', 'Gym']);
  });

  it('adds a valid expense, resets the form and shows a toast', async () => {
    await createComponent();
    component.name = 'Shoes';
    component.category = 'Food';
    component.amount = 50;
    const date = component.date;

    await component.addExpense();

    expect(TestBed.inject(ExpenseService).getExpenses()).toEqual([
      { name: 'Shoes', date, category: 'Food', amount: 50 },
    ]);
    expect(component.name).toBe('');
    expect(component.category).toBeNull();
    expect(component.amount).toBe(0);
    expect(toast.create).toHaveBeenCalledWith(expect.objectContaining({ message: 'Expense is added' }));
  });

  it('falls back to "Uncategorised" when no category is chosen', async () => {
    await createComponent();
    component.name = 'Misc';
    component.amount = 5;

    await component.addExpense();

    expect(TestBed.inject(ExpenseService).getExpenses()[0].category).toBe('Uncategorised');
  });

  it('rejects invalid input without saving', async () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    await createComponent();
    component.name = 'Free thing';
    component.amount = 0;

    await component.addExpense();

    expect(alertSpy).toHaveBeenCalledWith('Please fill in all fields with valid data');
    expect(TestBed.inject(ExpenseService).getExpenses()).toEqual([]);
    alertSpy.mockRestore();
  });

  it('formats the picked date and closes the date picker', async () => {
    await createComponent();
    component.openDatePicker();
    expect(component.isDatePickerOpen).toBe(true);

    component.onDateSelected({ detail: { value: '2026-03-15' } });

    expect(component.date).toBe(new Date('2026-03-15').toLocaleDateString('de'));
    expect(component.isDatePickerOpen).toBe(false);
  });

  it('navigates to the expense list', async () => {
    await createComponent();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    component.navigateToViewExpenses();
    expect(navigate).toHaveBeenCalledWith('/view-expenses');
  });
});
