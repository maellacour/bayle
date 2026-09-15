import { Fragment, useCallback, useMemo } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '../components/ui/popover';
import { Checkbox } from '../components/ui/checkbox';

export default function ToggleMenu({
  options,
  selectedIds = [],
  multi = false,
  align = 'start',
  onChange,
  children
}) {
  const selectedOptions = useMemo(() => {
    return selectedIds.map((id) => options.find((option) => option.id === id));
  }, [options, selectedIds]);

  const handleMenuItemClick = useCallback(
    (option) => () => {
      if (multi === false) {
        onChange([option]);
        // handleClose();
      } else {
        let newOptions;
        if (!option?.id) {
          newOptions = [option];
        } else if (selectedOptions.map(({ id }) => id).includes(option.id)) {
          newOptions = selectedOptions.filter(({ id }) => id !== option.id);
        } else {
          newOptions = [...selectedOptions, option];
        }
        onChange(newOptions);
      }
    },
    [multi, onChange, selectedOptions]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="p-1 m-0">
        <ul>
          {options.map((option, index) => {
            // Options are pre-ordered by group; a header starts each new group.
            const previousGroup = index > 0 ? options[index - 1].group : null;
            const showGroupHeader = option.group && option.group !== previousGroup;
            return (
              <Fragment key={option.id}>
                {showGroupHeader ? (
                  <li className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground select-none">
                    {option.group}
                  </li>
                ) : null}
                <li
                  className="p-2 hover:bg-primary/10 hover:cursor-pointer"
                  onClick={handleMenuItemClick(option)}
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedIds.includes(option.id)}
                    className="inline-block align-middle"
                  />
                  <span className="inline-block align-middle mt-0.5 ml-1 text-sm font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {option.label}
                  </span>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
