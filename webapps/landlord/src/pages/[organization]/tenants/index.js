import { fetchTenants, QueryKeys } from '../../../utils/restcalls';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { List } from '../../../components/ResourceList';
import { LuPlusCircle } from 'react-icons/lu';
import NewTenantDialog from '../../../components/tenants/NewTenantDialog';
import Page from '../../../components/Page';
import { StoreContext } from '../../../store';
import TenantList from '../../../components/tenants/TenantList';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import useTranslation from 'next-translate/useTranslation';
import { withAuthentication } from '../../../components/Authentication';

const STATUS_FILTER_IDS = ['inprogress', 'stopped'];
const PROPERTY_FILTER_PREFIX = 'property:';
const DEBTOR_FILTER_ID = 'debtor';

function _filterData(data, filters) {
  const selectedIds = filters.statuses || [];
  const selectedStatuses = selectedIds.filter((id) =>
    STATUS_FILTER_IDS.includes(id)
  );
  const selectedPropertyIds = selectedIds
    .filter((id) => id.startsWith(PROPERTY_FILTER_PREFIX))
    .map((id) => id.slice(PROPERTY_FILTER_PREFIX.length));
  const debtorsOnly = selectedIds.includes(DEBTOR_FILTER_ID);

  let filteredItems =
    selectedStatuses.length === 0
      ? data
      : data.filter(({ status }) => selectedStatuses.includes(status));

  if (selectedPropertyIds.length) {
    filteredItems = filteredItems.filter(({ properties }) =>
      properties?.some(({ propertyId }) =>
        selectedPropertyIds.includes(propertyId)
      )
    );
  }

  if (debtorsOnly) {
    filteredItems = filteredItems.filter(({ balance }) => (balance || 0) > 0);
  }

  if (filters.searchText) {
    const regExp = /\s|\.|-/gi;
    const cleanedSearchText = filters.searchText
      .toLowerCase()
      .replace(regExp, '');

    filteredItems = filteredItems.filter(
      ({ isCompany, name, manager, contacts, properties }) => {
        // Search match name
        let found =
          name.replace(regExp, '').toLowerCase().indexOf(cleanedSearchText) !=
          -1;

        // Search match manager
        if (!found && isCompany) {
          found =
            manager
              ?.replace(regExp, '')
              .toLowerCase()
              .indexOf(cleanedSearchText) != -1;
        }

        // Search match contact
        if (!found) {
          found = !!contacts
            ?.map(({ name: contact = '', email = '', phone = '' }) => ({
              contact: contact.replace(regExp, '').toLowerCase(),
              email: email.toLowerCase(),
              phone: phone.replace(regExp, '')
            }))
            .filter(
              ({ contact, email, phone }) =>
                contact.indexOf(cleanedSearchText) != -1 ||
                email.indexOf(cleanedSearchText) != -1 ||
                phone.indexOf(cleanedSearchText) != -1
            ).length;
        }

        // Search match property name
        if (!found) {
          found = !!properties?.filter(
            ({ property: { name } }) =>
              name
                .replace(regExp, '')
                .toLowerCase()
                .indexOf(cleanedSearchText) != -1
          ).length;
        }
        return found;
      }
    );
  }
  return filteredItems;
}

function Tenants() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const store = useContext(StoreContext);
  const { isError, data, isLoading } = useQuery({
    queryKey: [QueryKeys.TENANTS],
    queryFn: () => fetchTenants(store)
  });
  const [openNewTenantDialog, setOpenNewTenantDialog] = useState(false);

  const filters = useMemo(() => {
    const seen = new Set();
    const propertyOptions = [];
    data?.forEach(({ properties }) =>
      properties?.forEach(({ propertyId, property }) => {
        if (propertyId && !seen.has(propertyId)) {
          seen.add(propertyId);
          propertyOptions.push({
            id: `${PROPERTY_FILTER_PREFIX}${propertyId}`,
            label: property?.name || propertyId
          });
        }
      })
    );
    propertyOptions.sort((a, b) => a.label.localeCompare(b.label));

    return [
      { id: 'inprogress', label: t('Lease running'), group: t('Lease') },
      { id: 'stopped', label: t('Lease ended'), group: t('Lease') },
      {
        id: DEBTOR_FILTER_ID,
        label: t('With an unpaid balance'),
        group: t('Balance')
      },
      ...propertyOptions.map((option) => ({
        ...option,
        group: t('Properties')
      }))
    ];
  }, [data, t]);

  const onNewTenant = useCallback(() => {
    setOpenNewTenantDialog(true);
  }, [setOpenNewTenantDialog]);

  if (isError) {
    toast.error(t('Error fetching tenants'));
  }

  return (
    <Page title={t('Tenants')} loading={isLoading} dataCy="tenantsPage">
      <List
        data={data}
        filters={filters}
        defaultFilterIds={['inprogress']}
        filterFn={_filterData}
        renderActions={() => (
          <Button
            variant="secondary"
            className="w-full gap-2"
            onClick={onNewTenant}
          >
            <LuPlusCircle className="size-4" />
            {t('Add a tenant')}
          </Button>
        )}
        renderList={({ data }) => <TenantList tenants={data} />}
      />
      <NewTenantDialog
        open={openNewTenantDialog}
        setOpen={setOpenNewTenantDialog}
      />
    </Page>
  );
}

export default withAuthentication(Tenants);
