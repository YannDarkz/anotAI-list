import { TestBed } from '@angular/core/testing';

import { UserFireService } from './user-fire.service';

describe('UserFireService', () => {
  let service: UserFireService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserFireService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
