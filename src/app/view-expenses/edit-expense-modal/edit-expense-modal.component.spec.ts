import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DatetimeCustomEvent, ModalController, provideIonicAngular } from '@ionic/angular';

import { EditExpenseModalComponent } from './edit-expense-modal.component';
import { Expense } from '../../model/expense.model';

describe('EditExpenseModalComponent', () => {
  let component: EditExpenseModalComponent;
  let fixture: ComponentFixture<EditExpenseModalComponent>;
  let modal: { dismiss: ReturnType<typeof vi.fn> };

  const coffee: Expense = { name: 'Coffee', date: '1.2.2026', category: 'Food', amount: 3.5 };

  async function open(expense: Expense = coffee, categories = ['Food', 'Transport']) {
    fixture = TestBed.createComponent(EditExpenseModalComponent);
    component = fixture.componentInstance;
    component.expense = expense;
    component.categories = categories;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    modal = { dismiss: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [EditExpenseModalComponent],
      providers: [provideIonicAngular(), { provide: ModalController, useValue: modal }],
    }).compileComponents();
  });

  it('starts with the expense values', async () => {
    await open();
    expect(component.name).toBe('Coffee');
    expect(component.category).toBe('Food');
    expect(component.amount).toBe(3.5);
    expect(component.isoDate).toBe('2026-02-01');
    expect(component.categoryOptions).toEqual(['Food', 'Transport']);
  });

  it('keeps a category that is no longer in the list selectable', async () => {
    await open({ ...coffee, category: 'Uncategorised' });
    expect(component.categoryOptions).toEqual(['Food', 'Transport', 'Uncategorised']);
  });

  it('saves the edited values, trimming the name', async () => {
    await open();
    component.name = '  Espresso ';
    component.category = 'Transport';
    component.amount = 4;
    component.onDateChange({ detail: { value: '2026-03-15T00:00:00' } } as DatetimeCustomEvent);

    component.save();

    expect(modal.dismiss).toHaveBeenCalledWith(
      { name: 'Espresso', category: 'Transport', amount: 4, date: '15.3.2026' },
      'save',
    );
  });

  it('keeps the stored date text when the date was not changed', async () => {
    await open({ ...coffee, date: '01.02.2026' });
    component.save();
    expect(modal.dismiss).toHaveBeenCalledWith(expect.objectContaining({ date: '01.02.2026' }), 'save');
  });

  it('rejects an empty name or a non-positive amount', async () => {
    await open();
    component.name = '   ';
    component.save();
    component.name = 'Coffee';
    component.amount = 0;
    component.save();
    fixture.detectChanges();

    expect(modal.dismiss).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Please enter a name, a date and an amount');
  });

  it('cancels without changes', async () => {
    await open();
    component.cancel();
    expect(modal.dismiss).toHaveBeenCalledWith(null, 'cancel');
  });
});
