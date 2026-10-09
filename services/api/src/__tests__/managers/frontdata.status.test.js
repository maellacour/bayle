import * as FD from '../../managers/frontdata.js';
import moment from 'moment';

// The lease status shown to the landlord. A renewable lease whose end date
// has lapsed is not over: the end date rolls forward on the next rent access
// (tacit renewal), so only a termination date may end it.
describe('toOccupantData contract status', () => {
  const occupant = (overrides) => ({
    _id: 't1',
    name: 'Alice',
    beginDate: moment().subtract(2, 'years').toDate(),
    ...overrides
  });

  it('flags a lapsed non-renewable lease as ended', () => {
    const data = FD.toOccupantData(
      occupant({ endDate: moment().subtract(2, 'months').toDate() })
    );

    expect(data.terminated).toBe(true);
    expect(data.status).toBe('stopped');
  });

  it('keeps a lapsed renewable lease in progress', () => {
    const data = FD.toOccupantData(
      occupant({
        endDate: moment().subtract(2, 'months').toDate(),
        leaseId: { _id: 'l1', renewable: true }
      })
    );

    expect(data.terminated).toBe(false);
    expect(data.status).toBe('inprogress');
  });

  it('ends a renewable lease once a termination date is set', () => {
    const data = FD.toOccupantData(
      occupant({
        endDate: moment().subtract(2, 'months').toDate(),
        terminationDate: moment().subtract(3, 'months').toDate(),
        leaseId: { _id: 'l1', renewable: true }
      })
    );

    expect(data.terminated).toBe(true);
    expect(data.status).toBe('stopped');
  });

  it('keeps a running lease in progress', () => {
    const data = FD.toOccupantData(
      occupant({ endDate: moment().add(10, 'months').toDate() })
    );

    expect(data.terminated).toBe(false);
    expect(data.status).toBe('inprogress');
  });
});
