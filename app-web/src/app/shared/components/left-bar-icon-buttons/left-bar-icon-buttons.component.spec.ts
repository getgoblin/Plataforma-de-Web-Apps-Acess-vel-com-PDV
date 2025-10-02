import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeftBarIconButtonsComponent } from './left-bar-icon-buttons.component';

describe('LeftBarIconButtonsComponent', () => {
  let component: LeftBarIconButtonsComponent;
  let fixture: ComponentFixture<LeftBarIconButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftBarIconButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeftBarIconButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
