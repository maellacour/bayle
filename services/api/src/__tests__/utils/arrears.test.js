import moment from 'moment';
import { outstandingBalance } from '../../utils/arrears.js';

const term = (year, month) =>
  Number(moment({ year, month: month - 1, day: 1 }).format('YYYYMMDDHH'));
const rent = (year, month, grandTotal, payment) => ({
  term: term(year, month),
  total: { grandTotal, payment }
});

// End of September 2026.
const upTo = moment({ year: 2026, month: 8, day: 30 }).endOf('day');

describe('outstandingBalance', () => {
  it('returns 0 without rents', () => {
    expect(outstandingBalance({ rents: [] }, upTo)).toBe(0);
    expect(outstandingBalance({}, upTo)).toBe(0);
  });

  it('takes the amount carried by the last term reached', () => {
    // 5_balance rolls the running balance forward, so the last term's
    // grandTotal already holds the prior arrears.
    const tenant = {
      rents: [
        rent(2026, 7, 1000, 1000),
        rent(2026, 8, 2000, 1000),
        rent(2026, 9, 3000, 1000)
      ]
    };
    expect(outstandingBalance(tenant, upTo)).toBe(2000);
  });

  it('ignores terms after the cutoff', () => {
    const tenant = { rents: [rent(2026, 9, 1500, 0), rent(2026, 10, 3000, 0)] };
    expect(outstandingBalance(tenant, upTo)).toBe(1500);
  });

  it('nets a last month settled out of the deposit to zero', () => {
    // The deposit retention is recorded as a payment, so payment == grandTotal.
    const tenant = { rents: [rent(2026, 9, 835, 835)] };
    expect(outstandingBalance(tenant, upTo)).toBe(0);
  });

  it('is negative when the tenant is ahead', () => {
    const tenant = { rents: [rent(2026, 9, 835, 1000)] };
    expect(outstandingBalance(tenant, upTo)).toBe(-165);
  });
});
