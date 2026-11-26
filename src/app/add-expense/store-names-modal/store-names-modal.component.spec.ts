import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalController, provideIonicAngular } from '@ionic/angular';

import { StoreNamesModalComponent } from './store-names-modal.component';
import { StorageService } from '../../service/storage.service';
import { FakeStorageService } from '../../testing/fake-storage.service';

describe('StoreNamesModalComponent', () => {
  let component: StoreNamesModalComponent;
  let fixture: ComponentFixture<StoreNamesModalComponent>;
  let storage: FakeStorageService;
  let modal: { dismiss: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storage = new FakeStorageService();
    modal = { dismiss: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [StoreNamesModalComponent],
      providers: [
        provideIonicAngular(),
        { provide: StorageService, useValue: storage },
        { provide: ModalController, useValue: modal },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreNamesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create with the default categories', () => {
    expect(component).toBeTruthy();
    expect(component.categoryList).toEqual(['Food', 'Internet', 'Transport', 'Car']);
  });

  it('adds a new category and persists it', async () => {
    component.newCategory = 'Rent';
    await component.addStoreName();

    expect(component.categoryList).toContain('Rent');
    expect(component.newCategory).toBe('');
    expect(component.isInputInvalid).toBe(false);
    expect(JSON.parse((await storage.getItem('category')) as string)).toContain('Rent');
  });

  it('flags duplicate or empty categories as invalid', async () => {
    component.newCategory = 'Food';
    await component.addStoreName();
    expect(component.isInputInvalid).toBe(true);

    component.newCategory = '';
    await component.addStoreName();
    expect(component.isInputInvalid).toBe(true);
    expect(component.categoryList).toEqual(['Food', 'Internet', 'Transport', 'Car']);
  });

  it('removes a category and persists the change', async () => {
    await component.removeStoreName(0);
    expect(component.categoryList).toEqual(['Internet', 'Transport', 'Car']);
    expect(JSON.parse((await storage.getItem('category')) as string)).toEqual(['Internet', 'Transport', 'Car']);
  });

  it('dismisses the modal with the current list', () => {
    component.dismissModal();
    expect(modal.dismiss).toHaveBeenCalledWith(component.categoryList);
  });
});
