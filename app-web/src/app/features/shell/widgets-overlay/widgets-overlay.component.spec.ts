import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetsOverlayComponent } from './widgets-overlay.component';

describe('WidgetsOverlayComponent', () => {
  let component: WidgetsOverlayComponent;
  let fixture: ComponentFixture<WidgetsOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetsOverlayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WidgetsOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
