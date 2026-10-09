import { useEffect, useRef } from 'react';
import { useField, useFormikContext } from 'formik';

import { DateField } from './DateField';
import { durationEndMoment } from '@bayle/commonui/utils/contract';
import moment from 'moment';

export function RangeDateField({
  beginName,
  endName,
  beginLabel,
  endLabel,
  minDate,
  maxDate,
  duration,
  disabled
}) {
  const { setFieldValue } = useFormikContext();
  const [beginField] = useField(beginName);
  const [endField] = useField(endName);
  const lastComputedFor = useRef();

  // When a lease duration is provided, the end date is derived from the begin
  // date and cannot be edited by hand. Recompute it only when the begin date
  // or the duration actually changes: a stored end date further away than
  // begin + duration is legitimate (tacit renewal rolls it forward) and must
  // not be snapped back on mount.
  useEffect(() => {
    if (!duration || !beginField.value?.isValid()) {
      return;
    }
    const computeKey = `${beginField.value.valueOf()}|${duration.toISOString()}`;
    if (lastComputedFor.current === computeKey) {
      return;
    }
    const isFirstRun = lastComputedFor.current === undefined;
    lastComputedFor.current = computeKey;
    if (isFirstRun && endField.value?.isValid?.()) {
      return;
    }
    let newEndDate = durationEndMoment(
      moment(beginField.value).startOf('day'),
      duration
    );
    if (maxDate?.isValid?.() && newEndDate.isAfter(maxDate)) {
      newEndDate = moment(maxDate);
    }
    if (!newEndDate.isSame(endField.value)) {
      setFieldValue(endName, newEndDate, true);
    }
  }, [
    duration,
    beginField.value,
    endField.value,
    endName,
    setFieldValue,
    maxDate
  ]);

  const boundedMin = (minDate?.isValid?.() && minDate) || undefined;
  const boundedMax = (maxDate?.isValid?.() && maxDate) || undefined;

  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
      <DateField
        label={beginLabel}
        name={beginName}
        minDate={boundedMin}
        maxDate={boundedMax}
        disabled={disabled}
      />
      <DateField
        label={endLabel}
        name={endName}
        minDate={beginField.value || boundedMin}
        maxDate={boundedMax}
        disabled={disabled || !!duration}
      />
    </div>
  );
}
