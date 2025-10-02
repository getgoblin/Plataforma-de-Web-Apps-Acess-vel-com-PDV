import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WindowTopComponent } from './window-top.component';

describe('WindowTopComponent', () => {
  let component: WindowTopComponent;
  let fixture: ComponentFixture<WindowTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WindowTopComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WindowTopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
