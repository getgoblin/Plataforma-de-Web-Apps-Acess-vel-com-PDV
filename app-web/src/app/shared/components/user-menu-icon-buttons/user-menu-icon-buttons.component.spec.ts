// user-menu-icon-buttons.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserMenuIconButtonComponent } from './user-menu-icon-buttons.component';

describe('UserMenuIconButtonComponent', () => {
  let component: UserMenuIconButtonComponent;
  let fixture: ComponentFixture<UserMenuIconButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserMenuIconButtonComponent] // standalone
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenuIconButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
