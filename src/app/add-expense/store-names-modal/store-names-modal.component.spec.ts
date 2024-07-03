import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StoreNamesModalComponent } from './store-names-modal.component';

describe('StoreNamesModalComponent', () => {
  let component: StoreNamesModalComponent;
  let fixture: ComponentFixture<StoreNamesModalComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [StoreNamesModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreNamesModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
