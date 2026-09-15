import moment from 'moment';

const round = (value) => Math.round(value * 100) / 100;

export function termMomentOf(rent) {
  const termMoment = rent.term && moment(rent.term, 'YYYYMMDDHH');
  return termMoment && termMoment.isValid() ? termMoment : null;
}

// What a tenant still owes as of `upTo`. The last term reached carries the
// running balance of every term before it (5_balance rolls `grandTotal -
// payment` forward), so the whole outstanding amount is held by that single
// term. Deposit retentions are recorded as payments (type 'deposit'), so a last
// month settled out of the deposit already nets to zero here.
export function outstandingBalance(tenant, upTo) {
  const lastTermReached = (tenant.rents || []).reduce((last, rent) => {
    const termMoment = termMomentOf(rent);
    if (!termMoment || termMoment.isAfter(upTo, 'day')) {
      return last;
    }
    return !last || termMoment.isAfter(last.termMoment)
      ? { termMoment, rent }
      : last;
  }, null);

  if (!lastTermReached) {
    return 0;
  }

  const { total } = lastTermReached.rent;
  return round(total.grandTotal - total.payment);
}
